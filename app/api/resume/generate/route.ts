import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Logger } from "next-axiom";

const logger = new Logger().with({
  route: "/api/resume/generate",
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text input is required" },
        { status: 400 }
      );
    }

    logger.info("Generating resume from user input");

    // Create a prompt that instructs the AI to parse the text and generate a structured resume
    const prompt = `
      You are a professional resume writer. Extract relevant information from the user's text and create a well-structured, 
      ATS-friendly resume. The resume should include the following:

      1. Name, contact information (email and phone if provided, otherwise use placeholder)
      2. Professional summary that highlights key strengths and career goals
      3. Work experience with company names, job titles, dates, and achievements
      4. Education details with institution names, degrees, and dates
      5. Skills section with technical and soft skills
      6. Any other relevant sections like certifications, languages, etc.

      Structure the resume in a clean, professional format that will pass ATS systems.
      
      Parse the following text and create a JSON object with the resume data:
      ${text}

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
    `;

    // Call OpenAI API to generate the resume
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    // Extract the resume JSON from the response
    const responseContent = completion.choices[0].message.content;

    if (!responseContent) {
      throw new Error("No content returned from OpenAI");
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
