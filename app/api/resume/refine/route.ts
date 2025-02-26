import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Logger } from "next-axiom";

const logger = new Logger().with({
  route: "/api/resume/refine",
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { conversation } = await req.json();

    if (!conversation || !Array.isArray(conversation)) {
      return NextResponse.json(
        { error: "Valid conversation history is required" },
        { status: 400 }
      );
    }

    logger.info("Refining resume based on user feedback");

    // Add system message if not present
    const messages = conversation.find((msg) => msg.role === "system")
      ? [...conversation]
      : [
          {
            role: "system",
            content: `
              You are a professional resume assistant. Your goal is to help the user refine and improve their resume.
              
              You should:
              1. Answer questions about best practices for resumes
              2. Provide suggestions for improvement
              3. Help with rewording and formatting
              4. Ensure the resume remains ATS-friendly
              
              When the user asks for specific changes to their resume, you should provide those changes in a JSON format
              that matches the original resume structure:
              
              {
                "name": "...",
                "email": "...",
                "phone": "...",
                "location": "...",
                "summary": "...",
                "sections": [
                  {
                    "title": "Work Experience",
                    "content": [...]
                  },
                  {
                    "title": "Education",
                    "content": [...]
                  },
                  ...
                ]
              }
              
              Only include JSON when you're suggesting specific changes to the resume structure. Otherwise, provide helpful guidance in natural language.
            `,
          },
          ...conversation,
        ];

    // Call OpenAI API for the response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content;

    if (!responseContent) {
      throw new Error("No content returned from OpenAI");
    }

    // Check if the response contains a JSON object (resume update)
    let updatedResume = null;
    const jsonMatch =
      responseContent.match(/```(?:json)?([\s\S]*?)```/) ||
      responseContent.match(/({[\s\S]*})/);

    if (jsonMatch) {
      try {
        const jsonString = jsonMatch[1];
        updatedResume = JSON.parse(jsonString.trim());
        logger.info("Resume update detected in AI response");
      } catch (error) {
        logger.error("Error parsing JSON in AI response", { error });
        // Continue without the JSON update
      }
    }

    // Clean the response if it contains JSON
    let message = responseContent;
    if (jsonMatch) {
      // Replace the JSON with a message about the update
      message = responseContent.replace(
        jsonMatch[0],
        "I've updated your resume with the changes you requested."
      );
    }

    logger.info("Resume refinement complete");
    await logger.flush();

    return NextResponse.json({
      message,
      updatedResume,
    });
  } catch (error) {
    logger.error("Error refining resume", { error });
    await logger.flush();
    return NextResponse.json(
      { error: "Failed to refine resume" },
      { status: 500 }
    );
  }
}
