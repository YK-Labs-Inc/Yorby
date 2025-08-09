import { NextRequest, NextResponse } from "next/server";
import {
  AccessToken,
  type AccessTokenOptions,
  AgentDispatchClient,
  type VideoGrant,
} from "livekit-server-sdk";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { withAxiom, AxiomRequest, Logger } from "next-axiom";

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// don't cache the results
export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export const GET = withAxiom(async (req: AxiomRequest) => {
  const log = req.log.with({
    function: "/api/livekit/connection-details",
    method: "GET",
    searchParams: Object.fromEntries(req.nextUrl.searchParams),
  });

  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (API_KEY === undefined) {
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (API_SECRET === undefined) {
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    // Get the current user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      log.error("Unauthorized access attempt", { error: userError });
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get mockInterviewId from query params
    const searchParams = req.nextUrl.searchParams;
    const mockInterviewId = searchParams.get("mockInterviewId");
    const candidateJobInterviewId = searchParams.get("candidateJobInterviewId");

    if (!mockInterviewId && !candidateJobInterviewId) {
      log.warn(
        "Missing mockInterviewId and candidateJobInterviewId in request"
      );
      return new NextResponse(
        "mockInterviewId or candidateJobInterviewId is required",
        {
          status: 400,
        }
      );
    }

    let interviewPrompt = "";
    if (mockInterviewId) {
      interviewPrompt = await fetchMockInterviewPrompt(mockInterviewId, log);
    } else if (candidateJobInterviewId) {
      interviewPrompt = await fetchCandidateJobInterviewPrompt(
        candidateJobInterviewId,
        log
      );
    }
    // Generate participant token
    const participantName =
      user.user_metadata?.full_name || user.email || "User";
    const participantIdentity = user.id;
    const roomName = crypto.randomUUID();
    const participantToken = await createParticipantToken(
      {
        identity: participantIdentity,
        name: participantName,
      },
      roomName
    );

    // Create agent dispatch after room and participant are set up
    const agentName = "interview_assistant";
    const agentDispatchClient = new AgentDispatchClient(
      LIVEKIT_URL,
      API_KEY,
      API_SECRET
    );

    try {
      const dispatch = await agentDispatchClient.createDispatch(
        roomName,
        agentName,
        {
          metadata: JSON.stringify({
            user_id: participantIdentity,
            candidate_name: participantName,
            interview_prompt: interviewPrompt,
            mock_interview_id: mockInterviewId || candidateJobInterviewId,
          }),
        }
      );
      log.info("Created agent dispatch", {
        dispatch,
        roomName,
        agentName,
      });
    } catch (error) {
      log.error("Failed to create agent dispatch", {
        error,
        roomName,
        agentName,
      });
      // Continue even if dispatch fails - the agent might join through other means
    }

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName,
    };

    log.info("Successfully created connection details", {
      roomName,
      participantName,
      userId: user.id,
    });

    const headers = new Headers({
      "Cache-Control": "no-store",
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    log.error("Error in connection details endpoint", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
});

const fetchMockInterviewPrompt = async (
  mockInterviewId: string,
  log: Logger
) => {
  const supabase = await createSupabaseServerClient();
  // Fetch the mock interview to get the interview prompt
  const { data: mockInterview, error: mockInterviewError } = await supabase
    .from("custom_job_mock_interviews")
    .select("interview_prompt")
    .eq("id", mockInterviewId)
    .single();

  if (mockInterviewError || !mockInterview) {
    log.error("Failed to fetch mock interview", {
      mockInterviewId,
      error: mockInterviewError,
    });
    throw Error("Mock interview not found");
  }
  return mockInterview.interview_prompt;
};

const fetchCandidateJobInterviewPrompt = async (
  candidateInterviewId: string,
  log: Logger
) => {
  const supabase = await createSupabaseServerClient();

  // First get the interview_id from candidate_job_interviews
  const { data: candidateInterview, error: candidateError } = await supabase
    .from("candidate_job_interviews")
    .select("interview_id")
    .eq("id", candidateInterviewId)
    .single();

  if (candidateError) {
    log.error("Error fetching candidate interview:", candidateError);
    throw new Error("Failed to fetch candidate interview");
  }

  if (!candidateInterview) {
    log.warn("No candidate interview found:", { candidateInterviewId });
    throw new Error("No interview found");
  }

  // Now fetch the questions for this interview
  const { data: questions, error } = await supabase
    .from("job_interview_questions")
    .select(
      `
      id,
      order_index,
      question:company_interview_question_bank(
        id,
        question,
        answer,
        question_type
      )
    `
    )
    .eq("interview_id", candidateInterview.interview_id)
    .order("order_index", { ascending: true });

  if (error) {
    log.error("Error fetching job interview questions:", error);
    throw new Error("Failed to fetch interview questions");
  }

  if (!questions || questions.length === 0) {
    log.warn("No interview questions found for interview:", {
      jobInterviewId: candidateInterview.interview_id,
    });
    return "";
  }

  // Format questions for the prompt
  const formattedQuestions = questions
    .map((q, index) => {
      return `
QUESTION ${index + 1}:
Question: ${q.question.question}
Expected Answer Guidelines: ${q.question.answer}`;
    })
    .join("\n");

  // Create the comprehensive interviewer prompt
  const interviewPrompt = `You are a professional job interviewer conducting a structured interview. Your role is to evaluate the candidate objectively while maintaining a professional, respectful, and encouraging demeanor.

## YOUR CORE RESPONSIBILITIES:

1. **Strict Adherence to Script**: You MUST ask the questions provided below in order. These are the only primary questions you are authorized to ask.

2. **Professional Persona**: 
   - Maintain a warm but professional tone
   - Be encouraging and supportive to help the candidate perform their best
   - Show active listening through acknowledgments like "I see," "That's interesting," or "Thank you for sharing that"
   - Remain neutral and objective in your responses

3. **Follow-up Questions**:
   - You MAY ask clarifying follow-up questions ONLY when:
     * The candidate's answer is unclear or incomplete
     * You need specific examples or details to better understand their response
     * The candidate mentions something directly relevant that warrants exploration
   - Follow-ups must be directly related to the candidate's response to the current question
   - Keep follow-ups concise and focused

4. **Conversation Flow**:
   - Begin with a brief, warm greeting (1-2 sentences)
   - Transition smoothly between questions
   - Acknowledge each answer before moving to the next question
   - End with a professional closing when all questions are complete

5. **STRICT CONSTRAINTS**:
   - DO NOT make up new interview questions outside the provided list
   - DO NOT skip questions or change their order
   - DO NOT share the expected answers with the candidate
   - DO NOT provide feedback on answer quality during the interview
   - DO NOT discuss topics unrelated to the interview questions
   - DO NOT reveal internal evaluation criteria

## INTERVIEW QUESTIONS TO ASK:
${formattedQuestions}

## INTERVIEW PROTOCOL:

1. Start with: "Hello! Thank you for joining us today. I'll be conducting your interview. Let's begin with our first question."

2. For each question:
   - Ask the question clearly and naturally
   - Allow the candidate to fully respond
   - Ask follow-ups only if needed for clarity
   - Thank them for their response
   - Move to the next question

3. Conclude with: "Thank you for your thoughtful responses. That concludes our interview questions. We'll be in touch regarding next steps."

## EVALUATION NOTES (INTERNAL USE ONLY - DO NOT SHARE):
- Listen for specific examples and concrete details
- Note how responses align with the expected answer guidelines
- Assess communication clarity and professionalism
- Consider depth of experience demonstrated

Remember: Your goal is to gather comprehensive information about the candidate while ensuring they have a positive interview experience. Stay on script, be professional, and create an environment where the candidate can showcase their best self.`;

  return interviewPrompt;
};

const createParticipantToken = (
  userInfo: AccessTokenOptions,
  roomName: string
) => {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "15m",
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return at.toJwt();
};
