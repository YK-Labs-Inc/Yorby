import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { generateTextWithFallback } from "@/utils/ai/gemini";
import { CoreMessage } from "ai";
import { getAllUserMemories } from "../memories/utils";

interface ChatRequestBody {
  message: string;
  mockInterviewId: string;
  isInitialMessage?: boolean;
  history?: CoreMessage[];
  speakingStyle?: string;
}

export async function POST(request: Request) {
  let logger = new Logger().with({
    method: "POST",
    path: "/api/chat",
  });

  try {
    logger.info("Chat request received");
    const {
      message,
      mockInterviewId,
      history = [],
      isInitialMessage = false,
      speakingStyle,
    } = (await request.json()) as ChatRequestBody;
    logger = logger.with({
      message,
      mockInterviewId,
      history,
      isInitialMessage,
      speakingStyle,
    });

    if (!isInitialMessage) {
      await saveMockInterviewMessage({
        mockInterviewId,
        role: "user",
        text: message,
      });
    }

    if (!message || !mockInterviewId) {
      logger.error("Message and mockInterviewId are required");
      return NextResponse.json(
        { error: "Message and mockInterviewId are required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: mockInterview, error: mockInterviewError } = await supabase
      .from("custom_job_mock_interviews")
      .select("interview_prompt")
      .eq("id", mockInterviewId)
      .single();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.error("User not found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (mockInterviewError || !mockInterview) {
      logger.error("Error fetching mock interview:", {
        error: mockInterviewError?.message,
      });
      return NextResponse.json(
        { error: "Failed to fetch interview details" },
        { status: 500 }
      );
    }

    const { files, knowledge_base } = await getAllUserMemories(user.id);

    const systemPrompt = `${mockInterview.interview_prompt}${
      speakingStyle
        ? `

    IMPORTANT: All of your responses should be written in the following speaking style:
    ${speakingStyle}`
        : ""
    }`;

    let messages: CoreMessage[] = [];

    if (files.length > 0 || knowledge_base) {
      messages.push({
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: knowledge_base
              ? `
              Form your response with information from the files attached in this message.

              Here is additionl information about the user who you are chatting with — include this context
              in your response wherever it is relevant and appropriate:

              ${knowledge_base}
              `
              : `Form your response with information from the files attached in this message.`,
          },
          ...files.map((file) => ({
            type: "file" as const,
            data: file.fileData.fileUri,
            mimeType: file.fileData.mimeType,
          })),
        ],
      });
    }

    messages.push(
      ...[
        ...history,
        {
          role: "user" as const,
          content: message,
        },
      ]
    );

    const response = await generateTextWithFallback({
      systemPrompt,
      messages,
      loggingContext: {
        mockInterviewId,
        messages,
        history,
        isInitialMessage,
        path: "/api/chat",
      },
    });

    logger.info("Chat response generated");

    await saveMockInterviewMessage({
      mockInterviewId,
      role: "model",
      text: response,
    });

    return NextResponse.json({ response });
  } catch (error: any) {
    logger.error("Chat error:", { error: error.message });
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

async function saveMockInterviewMessage({
  mockInterviewId,
  role,
  text,
}: {
  mockInterviewId: string;
  role: "user" | "model";
  text: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("mock_interview_messages").insert({
    mock_interview_id: mockInterviewId,
    role,
    text,
  });

  if (error) {
    throw error;
  }
}
