import { NextRequest } from "next/server";
import { Logger } from "next-axiom";
import { UploadResponse } from "@/utils/types";
import { streamTextResponseWithFallback } from "@/utils/ai/gemini";

export async function POST(req: NextRequest) {
  const data = (await req.json()) as {
    question: string;
    uploadResponse: UploadResponse;
  };
  const { question, uploadResponse } = data;
  let logger = new Logger().with({
    path: "/api/interview-copilot-demo-answer-question",
    question,
  });
  try {
    const fileData = {
      fileData: {
        fileUri: uploadResponse.file.uri,
        mimeType: uploadResponse.file.mimeType,
      },
    };
    const result = await streamTextResponseWithFallback({
      systemPrompt: answerQuestionPrompt({
        question,
      }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Answer the question based on the information provided.",
            },
            {
              type: "file" as "file",
              data: fileData.fileData.fileUri,
              mimeType: fileData.fileData.mimeType,
            },
          ],
        },
      ],
      loggingContext: {
        question,
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result) {
            // Encode the text chunk into a Uint8Array
            const encoded = new TextEncoder().encode(chunk);
            controller.enqueue(encoded);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
    await logger.flush();
    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=utf-8");
    return new Response(stream, { headers });
  } catch (error: unknown) {
    logger.error("Error answering question", { error });
    await logger.flush();
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
      }
    );
  }
}

const answerQuestionPrompt = ({ question }: { question: string }) => `
You are a candidate that is in the middle of a job interview. You are the best interviewee in the world.
You are going to be provided with an interview question that you must answer.
Answer the question by following the steps below.

# Steps

1. **Read the Questions**:
  - Read the interview question and understand what it is asking and create a criteria of what would be a strong answer.
  You might be provided optional information about the job title and the job description and company name and company description.
  If provided, use this additional information to create your criteria of what would be a strong answer.
  - If this is a follow-up question (indicated by previous questions and answers being provided), make sure to consider the context of the previous exchanges.
2. **Consult the user's work history to find relevant information**:
  - The user might upload their resume, cover letter, or other files that are relevant to the interview/their job history.
  If provided, read through the files and extract relevant information that can be used to answer the interview question.
3. **Answer The Question**: 
  - Using all of your information, answer the question in a way that fits the criteria you created in the first step
  - If this is a follow-up question, ensure your response is consistent with your previous answers and builds upon them naturally.
  - Provide a natural, conversational response as if you're speaking directly to the interviewer.
  - Use complete sentences and maintain a professional yet personable tone.
  - Keep the answer to be 60-90 seconds long.
  - Answer the question in a natural way as one would in a proper interview, don't just list off things from the resume and
  feel free to add any supporting details to make the answer flow more naturally.
4. **Double Check Your Answer**:
  - After you have answered the question, fact check your answer against the job title, job description, company name, and company description as 
  well as any additional information that the user uploaded about themselves via their resume, cover letter, or other files.
  - Do not make up any information. You can stretch the truth to make answers more relevant/more interesting/more impressive, but
  it must still be grounded on the information provided.
  - Ensure your answer is consistent with any previous answers you've provided in this interview session.
5. **Return the answer as a string**:
  - Return your answer to the interview question and nothing else. You absolutely cannot return anything
  that is not part of the answer to the question. Do not return your criteria, your thoughts, or anything else.
  Just return the answer to the question.
${
  question
    ? `# Question
${question}`
    : ""
}
`;
