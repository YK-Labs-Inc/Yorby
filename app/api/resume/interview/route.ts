import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { Logger } from "next-axiom";

const logger = new Logger().with({
  route: "/api/resume/interview",
});

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

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
      
      Follow these guidelines:
      1. Ask one question at a time in a friendly, conversational manner
      2. Start by asking for their name, then contact information (email, phone, location)
      3. Then ask about their education history, work experience, skills, and any other relevant information
      4. For work experience, ask about their responsibilities and achievements at each job
      5. Ask follow-up questions when you need more details or clarification
      6. Keep responses short, focused and conversational
      7. Never overwhelm the user with multiple questions at once
      
      IMPORTANT: When you've gathered all essential information (name, contact info, education, work experience, skills), 
      set isResumeReady: true in your response. Only do this when you have enough information to generate a complete resume.
      
      The user's responses will be used to create their professional resume.
    `;

    // Configure Gemini model with safety settings
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Convert messages to Gemini chat format
    const chatHistory = messages.map(
      (msg: { role: string; content: string }) => {
        return {
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        };
      }
    );

    // Create a chat session
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      },
    });

    // Send a prompt to continue the conversation
    const result = await chat.sendMessage(
      "Continue the interview process. Remember to follow the guidelines from earlier."
    );
    const responseContent = result.response.text();

    // Determine if we have enough information to generate a resume
    const isResumeReady =
      hasGatheredEssentialInfo(messages) &&
      responseContent.toLowerCase().includes("thank you") &&
      messages.length >= 10;

    logger.info("Interview response generated", { isResumeReady });
    await logger.flush();

    return NextResponse.json({
      message: responseContent,
      isResumeReady,
    });
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
