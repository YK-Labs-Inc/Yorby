import { sendMessageWithFallback } from "@/utils/ai/gemini";
import { NextResponse } from "next/server";
import { AxiomRequest, withAxiom } from "next-axiom";

export const POST = withAxiom(async (req: AxiomRequest) => {
  const { resume, userMessage } = (await req.json()) as {
    resume: string;
    userMessage: string;
  };
  const updatedResume = await updateResume(JSON.stringify(resume), userMessage);

  return NextResponse.json({ updatedResume }, { status: 200 });
});

const updateResume = async (resume: string, userMessage: string) => {
  const prompt = `
    You are an AI assistant that can help users edit their resume.
    
    You will be given a resume in JSON format and a comment from the user about what they want to change.
    
    Your job is to update the resume in the JSON format to reflect the changes.

    Return only the updated resume in the same exact JSON format as the original resume and nothing else.

    Your response will be parsed as JSON so make sure your response is a valid JSON without any modifications necessary.
    
    Here is the resume:
    ${resume}
    `;

  const result = await sendMessageWithFallback({
    contentParts: [userMessage],
    history: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  const resp = result.response.text();
  const json = extractJSONFromString(resp);
  return JSON.parse(json);
};

const extractJSONFromString = (text: string): string => {
  try {
    // First try to parse the entire string as JSON
    JSON.parse(text);
    return text;
  } catch {
    // If that fails, try to find JSON-like content
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      const possibleJson = jsonMatch[0];
      try {
        // Validate that it's actually JSON
        JSON.parse(possibleJson);
        return possibleJson;
      } catch {
        throw new Error("No valid JSON found in the response");
      }
    }
    throw new Error("No JSON-like content found in the response");
  }
};
