import { NextResponse } from "next/server";
import { Content, SchemaType } from "@google/generative-ai";
import { sendMessageWithFallback } from "@/utils/ai/gemini";
import { AxiomRequest, withAxiom } from "next-axiom";

export const POST = withAxiom(async (req: AxiomRequest) => {
  let logger = req.log.with({
    route: "/api/resume/interview",
  });
  try {
    const { messages } = (await req.json()) as {
      messages: Content[];
    };
    const latestUserMessage = messages[messages.length - 1].parts[0].text;

    if (!messages || !Array.isArray(messages)) {
      logger.error("Invalid messages array", { messages });
      return NextResponse.json(
        { error: "Valid messages array is required" },
        { status: 400 }
      );
    }
    if (!latestUserMessage) {
      logger.error("Latest user message is required");
      return NextResponse.json(
        { error: "Latest user message is required" },
        { status: 400 }
      );
    }
    logger = logger.with({
      latestUserMessage,
      messages,
    });

    logger.info("Processing interview conversation");

    // Create a system prompt for the interview process
    const systemPrompt = `
    You are an AI interviewer helping users create a professional resume. Your job is to have a conversation with them to gather all necessary information for a complete resume.
      
    Your goal is to obtain the following information from the user in the order provided:
    - Name
    - Email
    - Phone
    - Location
    - Education
    - Work Experience
    - Skills

    As you chat back and forth with the user, ask questions to gather the information you need.

    Ask for each piece of information one at a time.

    I will now provide you with more specific instructions for certain pieces of information.

    ## Education
    - Ask for the school, degree, graduation year, and GPA
    - At the end, ask for any additional information about the education. If they respond and indicate that they have no more 
    information to provide about their education, then you can move onto the work experience section.

    ## Work Experience
    - Ask for the company, title, start date, end date, and what they did at the company
    - For each company that they work for, we should aim for 3-5 bullet points of what they did at the company. Do your best to ask for more information
    about their responsibilities and accomplishments. If they are unable to provide more information, then move onto the next company.
    - At the end, ask for any additional information about the work experience. If they do not have any additional work experience, move onto the skills section.
    
    ## Skills
    - Ask for the skills that they are most proficient in
    - Ask for the skills that they are most interested in
    - At the end, ask for any additional information about the skills. If they do not have any additional skills, then you can move onto completing the interview. 

    ## Response Format
    - When you have gathered all of the information, set the interviewIsComplete to true.
    - When you have gathered all of the information, set the interviewerResponse to "Thanks for chatting — I'll generate your resume now."
    - When you have not gathered all of the information, set the interviewIsComplete to false.
    - When you have not gathered all of the information, provide a response to the user that is your next sentence in your interview with the user.
    `;

    // Convert messages to Gemini chat format
    const chatHistory = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      ...messages.slice(0, -1),
    ];

    // Send a prompt to continue the conversation
    const result = await sendMessageWithFallback({
      contentParts: latestUserMessage,
      history: chatHistory,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          interviewIsComplete: {
            type: SchemaType.BOOLEAN,
          },
          interviewerResponse: {
            type: SchemaType.STRING,
          },
        },
        required: ["interviewIsComplete", "interviewerResponse"],
      },
      loggingContext: {
        route: "/api/resume/interview",
        latestUserMessage,
        chatHistory,
      },
    });

    const { interviewIsComplete, interviewerResponse } = JSON.parse(
      result.response.text()
    ) as {
      interviewIsComplete: boolean;
      interviewerResponse: string;
    };
    logger.info("Interview response generated", {
      interviewIsComplete,
      interviewerResponse,
    });

    await logger.flush();

    return NextResponse.json({
      interviewIsComplete,
      interviewerResponse,
    });
  } catch (error) {
    logger.error("Error in resume interview", { error });
    return NextResponse.json(
      { error: "Failed to process interview" },
      { status: 500 }
    );
  }
});
