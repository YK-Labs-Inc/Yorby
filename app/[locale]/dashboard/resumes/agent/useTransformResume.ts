import { CoreMessage } from "ai";
import {
  validateJobDescription,
  identifyChanges,
  ResumeActionType,
  handleTransformConversation,
  generateTransformedResumeTitle,
} from "./actions";
import { Dispatch, SetStateAction, useState } from "react";
import { ResumeDataType } from "../components/ResumeBuilder";
import { useResumeEditAgent } from "./useResumeEdit";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { saveResume } from "../actions";
import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";

export type ResumeTransformationChanges = {
  changeId: string;
  additionalChangeInformation?: string | null;
  changeType: ResumeActionType;
  changeDescription: string;
};

export const useTransformResume = ({
  setMessages,
  currentResume,
  setResume,
}: {
  setMessages: Dispatch<SetStateAction<CoreMessage[]>>;
  currentResume: ResumeDataType;
  setResume: (resume: ResumeDataType) => void;
}) => {
  const [showReturnToResumeButton, setShowReturnToResumeButton] =
    useState(false);
  const [
    startAdditionalInformationConversation,
    setStartAdditionalInformationConversation,
  ] = useState(false);
  const [changes, setChanges] = useState<ResumeTransformationChanges[]>([]);
  const { handleActions } = useResumeEditAgent({
    setMessages,
    currentResume,
    setResume,
  });
  const router = useRouter();
  const sendTransformResume = async (messages: CoreMessage[]) => {
    // Add user message
    setMessages(messages);

    // Add loading message
    setMessages((messages) => [
      ...messages,
      { role: "assistant", content: "" },
    ]);

    try {
      // First, validate that we have a proper job description
      const { isValid, response } = await validateJobDescription(messages);

      // Replace loading message with validation response
      setMessages((messages) => [
        ...messages.slice(0, -1),
        { role: "assistant", content: response },
      ]);

      // If job description is not valid, stop here
      if (!isValid) {
        return;
      }

      // Add loading message for identifying changes
      setMessages((messages) => [
        ...messages,
        { role: "assistant", content: "" },
      ]);

      // Identify necessary changes by comparing resume against job description
      const { changes, noChangeResponse, changesRequireAdditionalInformation } =
        await identifyChanges(messages, currentResume);

      if (noChangeResponse) {
        setMessages((messages) => [
          ...messages.slice(0, -1),
          { role: "assistant", content: noChangeResponse },
        ]);
        setShowReturnToResumeButton(true);
        return;
      }

      if (changesRequireAdditionalInformation) {
        handleStartAdditionalInformationConversation(changes);
      } else {
        setMessages((messages) => [
          ...messages.slice(0, -1),
          {
            role: "assistant",
            content:
              "I found a few changes that need to be made to your resume. I'll go ahead and make them for you.",
          },
        ]);
        performChanges(changes, messages);
      }
    } catch (error) {
      // If there's an error, remove the loading message
      setMessages((messages) => messages.slice(0, -1));
      throw error;
    }
  };

  const performChanges = async (
    changes: ResumeTransformationChanges[],
    messages: CoreMessage[]
  ) => {
    await handleActions({
      actions: changes.map((change) => ({
        action: change.changeType,
        actionDetails: change.changeDescription,
      })),
      currentResume,
      messages,
      setMessages,
    });
    await saveTransformedResume(messages);
    setMessages((messages) => [
      ...messages,
      {
        role: "assistant",
        content:
          "I just finished updating your resume — I'm going to take you to the updated resume now",
      },
    ]);
  };

  const saveTransformedResume = async (messages: CoreMessage[]) => {
    const supabase = createSupabaseBrowserClient();

    // Generate a unique title based on the job description from message history
    const { title } = await generateTransformedResumeTitle(messages);
    const { data, error } = await supabase
      .from("resumes")
      .insert({
        user_id: currentResume.user_id,
        name: currentResume.name,
        email: currentResume.email,
        phone: currentResume.phone,
        location: currentResume.location,
        summary: currentResume.summary,
        title: title,
        locked_status: currentResume.locked_status,
      })
      .select("id")
      .single();
    if (error) {
      Sentry.captureException(error);
      alert("Sorry, something went wrong. Please try again.");
    } else {
      await saveResume(
        {
          ...currentResume,
          id: data.id,
          title,
        },
        data.id
      );
      router.push(`/dashboard/resumes/${data.id}`);
    }
  };

  const handleStartAdditionalInformationConversation = async (
    changes: ResumeTransformationChanges[]
  ) => {
    setChanges(changes);
    const { response } = await handleTransformConversation(
      [
        {
          role: "user",
          content: `Begin the conversation and ask me questions about the additional information you need to make the changes to my resume.`,
        },
      ],
      changes,
      currentResume
    );
    setMessages((messages) => [
      ...messages.slice(0, -1),
      { role: "assistant", content: response },
    ]);
    setStartAdditionalInformationConversation(true);
  };

  const handleAdditionalInformationConversation = async (
    newMessages: CoreMessage[],
    setMessages: Dispatch<SetStateAction<CoreMessage[]>>,
    currentResume: ResumeDataType
  ) => {
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    const { isReady, response } = await handleTransformConversation(
      newMessages,
      changes,
      currentResume
    );
    setMessages((messages) => [
      ...messages.slice(0, -1),
      { role: "assistant", content: response },
    ]);
    if (isReady) {
      performChanges(changes, newMessages);
    }
  };

  return {
    sendTransformResume,
    showReturnToResumeButton,
    startAdditionalInformationConversation,
    handleAdditionalInformationConversation,
  };
};
