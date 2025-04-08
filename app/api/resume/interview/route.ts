import { NextResponse } from "next/server";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { AxiomRequest, withAxiom } from "next-axiom";
import { z } from "zod";
import { CoreMessage } from "ai";
import { Tables } from "@/utils/supabase/database.types";
import { GoogleAIFileManager } from "@google/generative-ai/dist/server/server";
import {
  createSupabaseServerClient,
  downloadFile,
} from "@/utils/supabase/server";
import { uploadFileToGemini } from "@/app/[locale]/landing2/actions";
import { UploadResponse } from "@/utils/types";

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

export const POST = withAxiom(async (req: AxiomRequest) => {
  let logger = req.log.with({
    route: "/api/resume/interview",
  });
  try {
    const {
      messages,
      speakingStyle,
      fileIds = [],
    } = (await req.json()) as {
      messages: CoreMessage[];
      speakingStyle?: string;
      fileIds?: string[];
    };

    if (!messages || !Array.isArray(messages)) {
      logger.error("Invalid messages array", { messages });
      return NextResponse.json(
        { error: "Valid messages array is required" },
        { status: 400 }
      );
    }
    logger = logger.with({
      messages,
    });

    logger.info("Processing interview conversation");

    // Create a system prompt for the interview process
    const systemPrompt = `
    You are an AI interviewer helping users create a professional resume. Your job is to have a conversation with them to gather all necessary information for a complete resume.${
      speakingStyle
        ? `
    
    IMPORTANT: All of your responses should be written in the following speaking style:
    ${speakingStyle}`
        : ""
    }
      
    Your goal is to obtain the following information from the user in the order provided:
    - Name
    - Email
    - Phone
    - Location
    - Education
    - Work Experience
    - Skills

    If the user tries to provide information outside of these categories, politely ask them to stick to the categories provided and that 
    after the initial resume is created, they can add more information and customize it to their liking.

    As you chat back and forth with the user, ask questions to gather the information you need.

    Ask for each piece of information one at a time.

    I will now provide you with more specific instructions for certain pieces of information.

    ## Education
    - Ask for the school, degree, graduation year, and GPA
    - At the end, ask for any additional information about the education. If they respond and indicate that they have no more 
    information to provide about their education, then you can move onto the work experience section.

    ## Work Experience
    - Ask for the company, title, start date, end date, and what they did at the company
    - For each company that they work for, ask them about their responsibilities and accomplishments. This information will be used to generate a list of bullet points for the resume.
    We will try to generate 3-5 bullet points for each company, so ask for as much information as possible about their responsibilities and accomplishments. If they 
    do not have any additional information about a company, then move onto the next company.
    - At the end, ask for any additional information about the work experience. If they do not have any additional work experience, move onto the skills section.
    
    ## Skills
    - Ask for the skills that they are most proficient in and have experience with
    - At the end, ask for any additional information about the skills. If they do not have any additional skills, then you can move onto completing the interview. 

    ## Response Format
    - When you have gathered all of the information, set the interviewIsComplete to true.
    - When you have gathered all of the information, set the interviewerResponse to "Thanks for chatting — I'll generate your resume now."
    - When you have not gathered all of the information, set the interviewIsComplete to false.
    - When you have not gathered all of the information, provide a response to the user that is your next sentence in your interview with the user.

    Conduct the interview in a friendly and engaging manner.

    Conduct the interview in the language of the user.
    `;
    const additionalFiles = await getAllFiles(fileIds);

    // Send a prompt to continue the conversation
    const result = await generateObjectWithFallback({
      systemPrompt,
      messages:
        additionalFiles.length > 0
          ? [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Use the following files as additional context to form your responses",
                  },
                  ...additionalFiles.map((file) => ({
                    type: "file" as "file",
                    data: file.fileData.fileUri,
                    mimeType: file.fileData.mimeType,
                  })),
                ],
              },
              ...messages,
            ]
          : messages,
      schema: z.object({
        interviewIsComplete: z.boolean(),
        interviewerResponse: z.string(),
      }),
      loggingContext: {
        route: "/api/resume/interview",
        messages,
      },
    });

    logger.info("Interview response generated", {
      ...result,
    });

    await logger.flush();

    return NextResponse.json({
      ...result,
    });
  } catch (error) {
    logger.error("Error in resume interview", { error });
    return NextResponse.json(
      { error: "Failed to process interview" },
      { status: 500 }
    );
  }
});

const getAllFiles = async (fileIds: string[]) => {
  const userFiles = await fetchUserFiles(fileIds);
  const fileStatuses = await Promise.all(userFiles.map(checkFileExists));
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

const fetchUserFiles = async (fileIds: string[]) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_files")
    .select("*")
    .in("id", fileIds);
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const checkFileExists = async (file: Tables<"user_files">) => {
  try {
    const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);
    await fileManager.getFile(file.google_file_name);
    return { file, status: true };
  } catch {
    return { file, status: false };
  }
};

const processMissingFile = async ({ file }: { file: Tables<"user_files"> }) => {
  const { display_name, file_path } = file;
  const data = await downloadFile({
    filePath: file_path,
    bucket: "user-files",
  });
  const uploadResponse = await uploadFileToGemini({
    blob: data,
    displayName: display_name,
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
    .from("user_files")
    .update({
      google_file_uri: uploadResponse.file.uri,
      google_file_name: uploadResponse.file.name,
      mime_type: uploadResponse.file.mimeType,
    })
    .eq("id", fileId);
  if (error) {
    throw new Error(error.message);
  }
};
