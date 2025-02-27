import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Logger } from "next-axiom";

const logger = new Logger().with({
  route: "/api/resume/interview",
});

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as {
      messages: { role: string; content: string }[];
    };
    const latestUserMessage = messages[messages.length - 1].content;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Valid messages array is required" },
        { status: 400 }
      );
    }

    logger.info("Processing interview conversation");

    // Create a system prompt for the interview process
    const systemPrompt = `
    You are an AI interviewer helping users create a professional resume. Your job is to have a conversation with them to gather all necessary information for a complete resume.
      
    Your goal is to obtain the following information from the user:
    - Name
    - Email
    - Phone
    - Location
    - Education
    - Work Experience
    - Skills

    Your resume should fit on a single page with size 11 font.

    As you chat back and forth with the user, ask questions to gather the information you need.

    When you have all the information you need, say "Thank you for your time. I have all the information I need to create your resume."
    `;

    // Configure Gemini model with safety settings
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    // Convert messages to Gemini chat format
    const chatHistory = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      ...messages.slice(0, -1).map((msg: { role: string; content: string }) => {
        return {
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        };
      }),
    ];

    // Create a chat session
    const chat = model.startChat({
      history: chatHistory,
    });

    // Send a prompt to continue the conversation
    const result = await chat.sendMessageStream(latestUserMessage);

    // Create a ReadableStream to stream the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let responseContent = "";

          for await (const chunk of result.stream) {
            const text = chunk.text();
            responseContent += text;

            // Encode the text chunk into a Uint8Array
            const encoded = new TextEncoder().encode(text);
            controller.enqueue(encoded);
          }

          logger.info("Interview response generated", { responseContent });
          await logger.flush();

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=utf-8");
    return new Response(stream, { headers });
  } catch (error) {
    logger.error("Error in resume interview", { error });
    await logger.flush();
    return NextResponse.json(
      { error: "Failed to process interview" },
      { status: 500 }
    );
  }
}

// Helper function to check if we've gathered essential information
function hasGatheredEssentialInfo(
  messages: Array<{ role: string; content: string }>
) {
  const userMessages = messages
    .filter((msg) => msg.role === "user")
    .map((msg) => msg.content.toLowerCase());

  const allContent = userMessages.join(" ");

  // Check for essential information - this is very basic and would need enhancements in production
  const hasName = userMessages.length >= 1; // First message usually contains name
  const hasEmail = allContent.includes("@") || allContent.includes("email");
  const hasEducation =
    allContent.includes("college") ||
    allContent.includes("university") ||
    allContent.includes("degree") ||
    allContent.includes("school");
  const hasWorkExperience =
    allContent.includes("work") ||
    allContent.includes("job") ||
    allContent.includes("experience") ||
    allContent.includes("company");
  const hasSkills =
    allContent.includes("skill") ||
    allContent.includes("can ") ||
    allContent.includes("know ") ||
    allContent.includes("proficient");

  // We need at least 5 user responses to have a meaningful conversation
  return (
    hasName &&
    hasEmail &&
    hasEducation &&
    hasWorkExperience &&
    hasSkills &&
    userMessages.length >= 5
  );
}
