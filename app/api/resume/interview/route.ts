import { NextResponse } from "next/server";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { AxiomRequest, withAxiom } from "next-axiom";
import { z } from "zod";
import { CoreMessage } from "ai";
import { getAllFiles } from "../utils";
import { getAllUserMemories } from "../../memories/utils";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export const POST = withAxiom(async (req: AxiomRequest) => {
  let logger = req.log.with({
    route: "/api/resume/interview",
  });
  try {
    const {
      messages,
      speakingStyle,
      additionalFileIds = [],
    } = (await req.json()) as {
      messages: CoreMessage[];
      speakingStyle?: string;
      existingResumeFileIds: string[];
      additionalFileIds: string[];
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
      additionalFileIds,
      speakingStyle,
    });

    logger.info("Processing interview conversation");

    // Get user ID from Supabase
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.error("User not found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }
    const userId = user.id;

    // Get user memories and files
    const { files: userFiles, knowledge_base } =
      await getAllUserMemories(userId);
    const additionalFiles = await getAllFiles(additionalFileIds);
    const combinedFiles = [...userFiles, ...additionalFiles];

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
    - Job Description They Are Making a Resume For

  ${
    combinedFiles.length > 0 &&
    `You are provided files that contains information about a user's previous work history and experience.
  
    Analyze the information provided in the files and determine which of the earlier fields is missing information.
    If you have all of the information you need, then you can move onto the next field.
  `
  }

    ${
      knowledge_base
        ? `Here is additional information about the user's work history and experience:

    ## Existing User Knowledge Base
    ${knowledge_base}`
        : ""
    }

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

    Your response should be written in the following format:
    {
      "interviewIsComplete": boolean, // Whether you have gathered all of the information you need
      "interviewerResponse": string // The next sentence in your interview with the user
    }
    `;

    // Send a prompt to continue the conversation
    const result = await generateObjectWithFallback({
      systemPrompt,
      messages:
        combinedFiles.length > 0
          ? [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Use the following files as additional context to form your responses.

                    Begin the conversation with the user.
                    `,
                  },
                  ...combinedFiles.map((file) => ({
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
      modelConfig: {
        primaryModel: "gemini-2.5-pro-preview-03-25",
        fallbackModel: "gemini-2.5-flash-preview-04-17",
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
