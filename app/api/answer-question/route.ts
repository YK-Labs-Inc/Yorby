import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";
import { Logger } from "next-axiom";
import {
  createSupabaseServerClient,
  downloadFile,
} from "@/utils/supabase/server";
import { Tables } from "@/utils/supabase/database.types";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { uploadFileToGemini } from "@/app/[locale]/landing2/actions";
import { UploadResponse } from "@/utils/types";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

const answerModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { interviewCopilotId, question, responseFormat } = data;
  let logger = new Logger().with({
    function: "answerQuestion",
    interviewCopilotId,
    question,
    responseFormat,
  });
  try {
    const files = await getAllInterviewCopilotFiles(interviewCopilotId);
    const { job_title, job_description, company_name, company_description } =
      await getInterviewCopilot(interviewCopilotId);
    const result = await answerModel.generateContentStream([
      answerQuestionPrompt({
        question,
        jobTitle: job_title,
        jobDescription: job_description,
        companyName: company_name,
        companyDescription: company_description,
        responseFormat,
      }),
      ...files,
    ]);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            // Encode the text chunk into a Uint8Array
            const encoded = new TextEncoder().encode(text);
            controller.enqueue(encoded);
          }
          const usageMetadata = (await result.response).usageMetadata as {
            promptTokenCount: number;
            candidatesTokenCount: number;
          };
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                inputTokens: usageMetadata?.promptTokenCount,
                outputTokens: usageMetadata?.candidatesTokenCount,
              })
            )
          );
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

const getInterviewCopilot = async (interviewCopilotId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_copilots")
    .select("*")
    .eq("id", interviewCopilotId)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

const answerQuestionPrompt = ({
  question,
  jobTitle,
  jobDescription,
  companyName,
  companyDescription,
  responseFormat,
}: {
  question: string;
  jobTitle: string | null;
  jobDescription: string | null;
  companyName: string | null;
  companyDescription: string | null;
  responseFormat: "verbatim" | "bullet";
}) => `
You are a candidate that is in the middle of a job interview. You are the best interviewee in the world.
You are going to be provided with an interview question that you must answer.
Answer the question by following the steps below.

# Steps

1. **Read the Questions**:
  - Read the interview question and understand what it is asking and create a criteria of what would be a strong answer.
  You might be provided optional information about the job title and the job description and company name and company description.
  If provided, use this additional information to create your criteria of what would be a strong answer.
2. **Consult the user's work history to find relevant information**:
  - The user might upload their resume, cover letter, or other files that are relevant to the interview/their job history.
  If provided, read through the files and extract relevant information that can be used to answer the interview question.
3. **Answer The Question**: 
  - Using all of your information, answer the question in a way that fits the criteria you created in the first step
${
  responseFormat === "bullet"
    ? `- Format your response as a concise list of bullet point.
    - Each bullet point must be very concise. Do not be overly verbose. Your answer should be 
    short and concise  for users to quickly read and digest the information and then create their
    own answer from your bullet points..
    - Do not be overly verbose.
    `
    : `- Provide a natural, conversational response as if you're speaking directly to the interviewer.
    - Use complete sentences and maintain a professional yet personable tone.
    `
}
4. **Double Check Your Answer**:
  - After you have answered the question, fact check your answer against the job title, job description, company name, and company description as 
  well as any additional information that the user uploaded about themselves via their resume, cover letter, or other files.
  - Do not make up any information. You can stretch the truth to make answers more relevant/more interesting/more impressive, but
  it must still be grounded on the information provided.
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

${
  jobTitle
    ? `# Job Title
${jobTitle}`
    : ""
}

${
  jobDescription
    ? `# Job Description
${jobDescription}`
    : ""
}

${
  companyName
    ? `# Company Name
${companyName}`
    : ""
}

${
  companyDescription
    ? `# Company Description
${companyDescription}`
    : ""
}
`;

const getAllInterviewCopilotFiles = async (interviewCopilotId: string) => {
  const interviewCopilotFiles =
    await fetchInterviewCopilotFiles(interviewCopilotId);
  const fileStatuses = await Promise.all(
    interviewCopilotFiles.map(checkFileExists)
  );
  return await Promise.all(
    fileStatuses.map(async ({ file, status }) => {
      if (!status) {
        const uploadResponse = await processMissingFile({ file });
        return {
          fileData: {
            fileUri: uploadResponse.file.uri,
            mimeType: uploadResponse.file.mimeType,
          },
        };
      }
      return {
        fileData: {
          fileUri: file.google_file_uri,
          mimeType: file.mime_type,
        },
      };
    })
  );
};

const fetchInterviewCopilotFiles = async (interviewCopilotId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_copilot_files")
    .select("*")
    .eq("interview_copilot_id", interviewCopilotId);
  if (error) {
    throw error;
  }
  return data;
};

const checkFileExists = async (file: Tables<"interview_copilot_files">) => {
  try {
    const fileManager = new GoogleAIFileManager(apiKey);
    await fileManager.getFile(file.google_file_name);
    return { file, status: true };
  } catch {
    return { file, status: false };
  }
};

const processMissingFile = async ({
  file,
}: {
  file: Tables<"interview_copilot_files">;
}) => {
  const { file_path } = file;
  const data = await downloadFile({
    filePath: file_path,
    bucket: "interview_copilot_files",
  });
  const displayName = file_path.split("/").pop() ?? file_path;
  const uploadResponse = await uploadFileToGemini({
    blob: data,
    displayName: displayName,
  });
  await updateFileInDatabase({
    uploadResponse,
    fileId: file.id,
  });
  return uploadResponse;
};

const updateFileInDatabase = async ({
  uploadResponse,
  fileId,
}: {
  uploadResponse: UploadResponse;
  fileId: string;
}) => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("interview_copilot_files")
    .update({
      google_file_uri: uploadResponse.file.uri,
      google_file_name: uploadResponse.file.name,
    })
    .eq("id", fileId);
  if (error) {
    throw error;
  }
};
