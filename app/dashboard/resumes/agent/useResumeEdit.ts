import { CoreMessage } from "ai";
import {
  createSection,
  deleteSection,
  updateSection,
  generateConclusionMessage,
  ResumeActionType,
  triageAction,
  updateContactInfo,
  handleOtherAction,
} from "./actions";
import { SetStateAction } from "react";
import { Dispatch } from "react";
import { ResumeDataType } from "../components/ResumeBuilder";

export const useResumeEditAgent = ({
  setMessages,
  currentResume,
  setResume,
}: {
  setMessages: Dispatch<SetStateAction<CoreMessage[]>>;
  currentResume: ResumeDataType | null;
  setResume: (resume: ResumeDataType) => void;
}) => {
  const sendResumeEdit = async (messages: CoreMessage[]) => {
    if (!currentResume) {
      return;
    }
    // Add user message
    setMessages(messages);

    // Add loading message
    setMessages((messages) => [
      ...messages,
      { role: "assistant", content: "" },
    ]);

    try {
      const { actions, response } = await triageAction(messages, currentResume);

      // Replace loading message with triage response
      setMessages((messages) => [
        ...messages.slice(0, -1),
        { role: "assistant", content: response },
      ]);

      if (!actions) {
        return;
      }

      // Collect all action responses
      const actionResponses = await handleActions({
        actions,
        currentResume,
        setMessages,
        messages,
      });

      // Add loading message for conclusion
      setMessages((messages) => [
        ...messages,
        { role: "assistant", content: "" },
      ]);

      // Generate and add conclusion message
      const conclusionMessage =
        await generateConclusionMessage(actionResponses);
      setMessages((messages) => [
        ...messages.slice(0, -1),
        { role: "assistant", content: conclusionMessage },
      ]);
    } catch (error) {
      // If there's an error, remove the loading message
      setMessages((messages) => messages.slice(0, -1));
      throw error;
    }
  };

  const handleActions = async ({
    actions,
    currentResume,
    setMessages,
    messages,
  }: {
    actions: {
      action: ResumeActionType;
      actionDetails: string;
      aiPerformingActionString?: string;
    }[];
    currentResume: ResumeDataType;
    setMessages?: Dispatch<SetStateAction<CoreMessage[]>>;
    messages: CoreMessage[];
  }): Promise<{ action: ResumeActionType; response: string }[]> => {
    const actionResponses: { action: ResumeActionType; response: string }[] =
      [];

    for (const action of actions) {
      const response = await handleAction({
        action,
        currentResume,
        setMessages,
        messages,
      });
      actionResponses.push({ action: action.action, response });
    }

    return actionResponses;
  };

  const handleAction = async ({
    action,
    currentResume,
    setMessages,
    messages,
  }: {
    action: {
      action: ResumeActionType;
      actionDetails: string;
      aiPerformingActionString?: string;
    };
    currentResume: ResumeDataType;
    setMessages?: Dispatch<SetStateAction<CoreMessage[]>>;
    messages: CoreMessage[];
  }): Promise<string> => {
    // Add action response message
    if (action.aiPerformingActionString) {
      setMessages?.((messages) => [
        ...messages,
        { role: "assistant", content: action.aiPerformingActionString! },
      ]);
    }

    // Add loading message for the action
    setMessages?.((messages) => [
      ...messages,
      { role: "assistant", content: "" },
    ]);

    try {
      switch (action.action) {
        case "create_section": {
          const { resumeSection, response: createResponse } =
            await createSection(messages, currentResume, action.actionDetails);
          if (resumeSection) {
            currentResume.resume_sections.push(resumeSection);
            setResume(currentResume);
          }

          // Replace loading message with create response
          setMessages?.((messages) => [
            ...messages.slice(0, -1),
            { role: "assistant", content: createResponse },
          ]);
          return createResponse;
        }

        case "delete_section": {
          const { sectionId, response: deleteResponse } = await deleteSection(
            messages,
            currentResume
          );
          if (sectionId) {
            const sectionIndex = currentResume.resume_sections.findIndex(
              (section) => section.id === sectionId
            );
            if (sectionIndex !== -1) {
              currentResume.resume_sections.splice(sectionIndex, 1);
              setResume(currentResume);
            }
          }
          // Replace loading message with delete response
          setMessages?.((messages) => [
            ...messages.slice(0, -1),
            { role: "assistant", content: deleteResponse },
          ]);
          return deleteResponse;
        }

        case "update_section": {
          const { resumeSection: updatedSection, response: updateResponse } =
            await updateSection(messages, currentResume, action.actionDetails);
          if (updatedSection) {
            const sectionIndex = currentResume.resume_sections.findIndex(
              (section) => section.id === updatedSection.id
            );
            if (sectionIndex !== -1) {
              currentResume.resume_sections[sectionIndex] = updatedSection;
            }
          }
          // Replace loading message with update response
          setMessages?.((messages) => [
            ...messages.slice(0, -1),
            { role: "assistant", content: updateResponse },
          ]);
          setResume(currentResume);
          return updateResponse;
        }

        case "update_contact_info": {
          const { updatedResume, response: updateResponse } =
            await updateContactInfo(
              messages,
              currentResume,
              action.actionDetails
            );
          if (updatedResume) {
            currentResume.email = updatedResume.email;
            currentResume.name = updatedResume.name;
            currentResume.phone = updatedResume.phone;
            currentResume.location = updatedResume.location;
            setResume(currentResume);
          }
          // Replace loading message with update response
          setMessages?.((messages) => [
            ...messages.slice(0, -1),
            { role: "assistant", content: updateResponse },
          ]);
          return updateResponse;
        }

        case "other": {
          const { updatedResume, response: updateResponse } =
            await handleOtherAction(
              messages,
              currentResume,
              action.actionDetails
            );
          if (updatedResume) {
            // Update all fields returned by the other action
            Object.assign(currentResume, updatedResume);
            setResume(currentResume);
          }
          // Replace loading message with update response
          setMessages?.((messages) => [
            ...messages.slice(0, -1),
            { role: "assistant", content: updateResponse },
          ]);
          return updateResponse;
        }
      }
    } catch (error) {
      // If there's an error, remove the loading message
      setMessages?.((messages) => messages.slice(0, -1));
      throw error;
    }
  };

  return { handleActions, sendResumeEdit };
};
