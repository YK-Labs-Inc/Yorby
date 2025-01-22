import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

interface ChatRequestBody {
  message: string;
  mockInterviewId: string;
  isInitialMessage?: boolean;
  history?: ChatMessage[];
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
    } = (await request.json()) as ChatRequestBody;
    logger = logger.with({
      message,
      mockInterviewId,
      history,
      isInitialMessage,
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

    if (mockInterviewError || !mockInterview) {
      logger.error("Error fetching mock interview:", {
        error: mockInterviewError?.message,
      });
      return NextResponse.json(
        { error: "Failed to fetch interview details" },
        { status: 500 }
      );
    }

    // Initialize the chat model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: mockInterview.interview_prompt }],
        },
        ...history,
      ],
    });

    const result = await chat.sendMessage([{ text: message }]);
    const response = result.response.text();

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
