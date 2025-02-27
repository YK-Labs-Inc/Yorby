import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { Logger } from "next-axiom";

const logger = new Logger().with({
  route: "/api/resume/generate",
});

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { conversation } = await req.json();

    if (!conversation || !Array.isArray(conversation)) {
      return NextResponse.json(
        { error: "Conversation history is required" },
        { status: 400 }
      );
    }

    logger.info("Generating resume from conversation history");

    // Extract user messages for context
    const userMessages = conversation
      .filter((msg: any) => msg.role === "user")
      .map((msg: any) => msg.content)
      .join("\n\n");

    // Create a prompt that instructs the AI to parse the conversation and generate a structured resume
    const prompt = `
      You are a professional resume writer. Extract relevant information from the user's conversation and create a well-structured, 
      ATS-friendly resume. The resume should include the following:

      1. Name, contact information (email and phone if provided, otherwise use placeholder)
      2. Professional summary that highlights key strengths and career goals
      3. Work experience with company names, job titles, dates, and achievements
      4. Education details with institution names, degrees, and dates
      5. Skills section with technical and soft skills
      6. Any other relevant sections like certifications, languages, etc.

      Structure the resume in a clean, professional format that will pass ATS systems.
      
      Carefully analyze the conversation history I'll provide to extract all relevant details.
      
      Return ONLY a JSON object with the following structure:
      {
        "name": "Full Name",
        "email": "email@example.com",
        "phone": "123-456-7890", // if provided, otherwise null
        "location": "City, State", // if provided, otherwise null
        "summary": "Professional summary text",
        "sections": [
          {
            "title": "Work Experience",
            "content": [
              {
                "title": "Job Title",
                "organization": "Company Name",
                "date": "Start Date - End Date",
                "description": ["Achievement 1", "Achievement 2", ...]
              },
              ...
            ]
          },
          {
            "title": "Education",
            "content": [
              {
                "title": "Degree",
                "organization": "Institution Name",
                "date": "Graduation Year",
                "description": "Additional details if any"
              },
              ...
            ]
          },
          {
            "title": "Skills",
            "content": ["Skill 1", "Skill 2", ...]
          },
          ...
        ]
      }

      Make sure the resume is professional and highlights the user's strengths effectively. 
      Ensure that all dates are formatted consistently and the structure is clean.
      
      Here is the conversation with the user about their resume information: 
        
      ${userMessages}
      
      Based on this conversation, please generate a professional resume in the JSON format described above.
    `;

    // Configure Gemini model with safety settings
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    // Generate the resume
    const result = await model.generateContent(prompt);
    const responseContent = result.response.text();

    if (!responseContent) {
      throw new Error("No content returned from Gemini");
    }

    // Parse the JSON response
    let resumeData;
    try {
      // Extract JSON from the response if it's wrapped in markdown code blocks
      const jsonMatch =
        responseContent.match(/```(?:json)?([\s\S]*?)```/) ||
        responseContent.match(/({[\s\S]*})/);

      const jsonString = jsonMatch ? jsonMatch[1] : responseContent;
      resumeData = JSON.parse(jsonString.trim());
    } catch (error) {
      logger.error("Failed to parse resume data", { error, responseContent });
      await logger.flush();
      throw new Error("Failed to parse resume data");
    }

    logger.info("Resume generated successfully");
    await logger.flush();

    return NextResponse.json({ resume: resumeData });
  } catch (error) {
    logger.error("Error generating resume", { error });
    await logger.flush();
    return NextResponse.json(
      { error: "Failed to generate resume" },
      { status: 500 }
    );
  }
}
