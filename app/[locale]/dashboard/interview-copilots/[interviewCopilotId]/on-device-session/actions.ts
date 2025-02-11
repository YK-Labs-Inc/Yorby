"use server";

import { uploadFileToGemini } from "@/app/[locale]/landing2/actions";
import { Tables } from "@/utils/supabase/database.types";
import {
  createSupabaseServerClient,
  downloadFile,
} from "@/utils/supabase/server";
import { UploadResponse } from "@/utils/types";
import { SchemaType, GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { Logger } from "next-axiom";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

const answerModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        answer: { type: SchemaType.STRING },
      },
      required: ["answer"],
    },
  },
});

const questionDetectionModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        questions: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
      },
      required: ["questions"],
    },
  },
});

export const answerQuestion = async (data: FormData) => {
  const interviewCopilotId = data.get("interviewCopilotId") as string;
  const question = data.get("question") as string;
  const responseFormat = data.get("responseFormat") as "verbatim" | "bullet";
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
    const result = await answerModel.generateContent([
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
    const totalInputTokens =
      result.response.usageMetadata?.promptTokenCount ?? 0;
    const totalOutputTokens =
      result.response.usageMetadata?.candidatesTokenCount ?? 0;
    logger = logger.with({
      inputTokenCount: totalInputTokens,
      outputTokenCount: totalOutputTokens,
      filesCount: files.length,
    });
    const { answer } = JSON.parse(result.response.text()) as {
      answer: string;
    };
    logger = logger.with({ answer });
    if (answer.length === 0) {
      logger.warn("Unable to answer question");
      await logger.flush();
      return {
        data: "",
        inputTokenCount: totalInputTokens,
        outputTokenCount: totalOutputTokens,
      };
    }
    logger.info("Answered interview question");
    await logger.flush();
    return {
      data: answer,
      inputTokenCount: totalInputTokens,
      outputTokenCount: totalOutputTokens,
    };
  } catch (error) {
    logger.error("Error answering question", { error });
    await logger.flush();
    return { data: "", inputTokenCount: 0, outputTokenCount: 0 };
  }
};

export const detectQuestions = async (data: FormData) => {
  const existingQuestions = data.getAll("existingQuestions") as string[];
  const transcript = data.get("transcript") as string;
  let logger = new Logger().with({
    function: "detectQuestions",
    transcript,
  });
  try {
    const result = await questionDetectionModel.generateContent([
      questionDetectionPrompt(transcript, existingQuestions),
    ]);
    const response = result.response.text();
    const { questions } = JSON.parse(response) as {
      questions: string[];
    };

    const totalInputTokens =
      result.response.usageMetadata?.promptTokenCount ?? 0;
    const totalOutputTokens =
      result.response.usageMetadata?.candidatesTokenCount ?? 0;

    logger = logger.with({
      inputTokenCount: totalInputTokens,
      outputTokenCount: totalOutputTokens,
      questions,
    });

    logger.info("Questions detected");
    await logger.flush();
    return {
      data: questions,
      inputTokenCount: totalInputTokens,
      outputTokenCount: totalOutputTokens,
    };
  } catch (error) {
    logger.error("Error detecting questions", { error });
    await logger.flush();
    return {
      data: [],
      inputTokenCount: 0,
      outputTokenCount: 0,
    };
  }
};

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

const questionDetectionPrompt = (
  transcript: string,
  existingQuestions: string[]
) => `
You are going to be provided a transcript from an interviewer for a job interview and a list of questions that have already been asked by the interviewer.

With this information, do the following:

## Steps
1. **Detect questions in the transcript**:
   - Read through the transcript and detect interview questions that have been asked by the interviewer.
2. **Deduplicate the questions**:
   - From the list of questions that you have detected from the previous step, deduplicate the questions.
   - Remove questions that have already been asked in the list of existing questions.
3. **Return the questions as a list of strings**:
   - Return the questions as a list of strings in a JSON object with the following format:

## Output format
   {
     "questions": string[]
   }

## Existing Questions
${existingQuestions.join("\n")}

## Transcript
${transcript}
`;

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
    ? "- Format your response as a concise list of bullet points, highlighting the key points clearly and efficiently. Each bullet point should be prefixed with '•' and be a complete thought."
    : "- Provide a natural, conversational response as if you're speaking directly to the interviewer. Use complete sentences and maintain a professional yet personable tone."
}
4. **Double Check Your Answer**:
  - After you have answered the question, fact check your answer against the job title, job description, company name, and company description as 
  well as any additional information that the user uploaded about themselves via their resume, cover letter, or other files.
  - Do not make up any information. You can stretch the truth to make answers more relevant/more interesting/more impressive, but
  it must still be grounded on the information provided.

# Output format
   {
     "answer": string 
   }

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
