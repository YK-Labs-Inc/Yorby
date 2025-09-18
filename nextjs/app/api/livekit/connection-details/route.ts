import { NextResponse } from "next/server";
import {
  AccessToken,
  type AccessTokenOptions,
  AgentDispatchClient,
  type VideoGrant,
} from "livekit-server-sdk";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { withAxiom, AxiomRequest, Logger } from "next-axiom";
import { getServerUser } from "@/utils/auth/server";

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
    const user = await getServerUser();

    if (!user) {
      log.error("Unauthorized access attempt");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get mockInterviewId from query params
    const searchParams = req.nextUrl.searchParams;
    const mockInterviewId = searchParams.get("mockInterviewId");
    const candidateJobInterviewId = searchParams.get("candidateJobInterviewId");
    const enableAiAvatar = searchParams.get("enableAiAvatar") === "true";
    const avatarProvider = searchParams.get("avatarProvider");
    const livekitMode = searchParams.get("livekitMode");
    const simliFaceId = searchParams.get("simliFaceId");
    const isDemo = searchParams.get("isDemo") === "true";

    if (!mockInterviewId && !candidateJobInterviewId && !isDemo) {
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
    const participantIdentity = isDemo ? crypto.randomUUID() : user.id;
    const roomName = crypto.randomUUID();
    const participantToken = await createParticipantToken(
      {
        identity: participantIdentity,
        name: participantName,
      },
      roomName
    );

    // Create agent dispatch after room and participant are set up
    const agentName = isDemo
      ? "demo_interview_assistant"
      : "interview_assistant";
    const agentDispatchClient = new AgentDispatchClient(
      LIVEKIT_URL,
      API_KEY,
      API_SECRET
    );
    const agentMetadata = isDemo
      ? {
          livekit_mode: livekitMode,
        }
      : {
          user_id: participantIdentity,
          candidate_name: participantName,
          interview_prompt: interviewPrompt,
          mock_interview_id: mockInterviewId,
          candidate_job_interview_id: candidateJobInterviewId,
          enable_ai_avatar: enableAiAvatar,
          avatar_provider: avatarProvider,
          livekit_mode: livekitMode,
          simli_face_id: simliFaceId,
        };

    try {
      const dispatch = await agentDispatchClient.createDispatch(
        roomName,
        agentName,
        {
          metadata: JSON.stringify(agentMetadata),
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

  // Fetch the interview details to get the interview type
  const { data: interview, error: interviewError } = await supabase
    .from("job_interviews")
    .select("interview_type")
    .eq("id", candidateInterview.interview_id)
    .single();

  if (interviewError) {
    log.error("Error fetching interview details:", interviewError);
    throw new Error("Failed to fetch interview details");
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

  // Create prompt based on interview type
  const interviewType = interview?.interview_type || "general";
  if (interviewType === "coding") {
    return createCodingInterviewPrompt({
      question: questions[0].question.question,
      answer: questions[0].question.answer,
    });
  } else {
    return createBehavioralInterviewPrompt(questions);
  }
};

const createBehavioralInterviewPrompt = (questions: any[]): string => {
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
   - DO NOT reiterate the candidate's answers back to them

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

3. After you have asked all of your questions, ask the user if there is anything else that they would like to add or talk about.
If they say that they do not have anything else to add, then the interview has ended. If they say that they have something else to add,
then ask them what it is and then ask them to continue with their response. Keep repeating this process until they say that they do not have anything else to add.
Once they say that they do not have anything else to add, then the interview has ended. The interview is only considered complete when they say that they do not have anything else to add.
Do not end the interview until they say that they do not have anything else to add.

## EVALUATION NOTES (INTERNAL USE ONLY - DO NOT SHARE):
- Listen for specific examples and concrete details
- Note how responses align with the expected answer guidelines
- Assess communication clarity and professionalism
- Consider depth of experience demonstrated

Remember: Your goal is to gather comprehensive information about the candidate while ensuring they have a positive interview experience. Stay on script, be professional, and create an environment where the candidate can showcase their best self.`;

  return interviewPrompt;
};

const createCodingInterviewPrompt = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}): string => {
  const problemStatement = question;
  const expectedSolution = answer;

  const interviewPrompt = `You are an experienced software engineer conducting a technical interview. Your role is to assess the candidate's coding abilities through a whiteboard-style problem-solving session.

## YOUR ROLE AND APPROACH:

1. **Interview Style**: 
   - Act as a supportive but professional technical interviewer
   - Maintain a calm, encouraging demeanor
   - Be patient and allow the candidate time to think
   - This is a whiteboard-style interview, not a live coding environment

2. **Communication Guidelines**:
   - Only respond when the candidate asks you a direct question or submits their solution
   - Allow the candidate to think out loud without interrupting
   - Keep responses concise and relevant
   - Do not volunteer information unless asked

## THE TECHNICAL PROBLEM:

**Problem Statement:**
${problemStatement}

**Expected Solution (FOR YOUR REFERENCE ONLY - NEVER SHARE THIS):**
${expectedSolution}

## INTERVIEW PROTOCOL:

### 1. OPENING (Your first message):
"Hello! I'm your interviewer today. This interview is going to be recorded and the purpose of this is to understand 
your thought process when solving problems.
Think out loud so we can understand your thought process.


I'm here if you have any clarifying questions. 

Just to set expectations: this is a whiteboard-style interview, so don't worry if your solution is not perfect. 
I'm more interested in your problem-solving approach than perfect syntax.
When you have a solution ready, submit your code and I'll review it.

You can submit an unlimited number of times, and I'll review each submission. Best of luck!"

That is all you need to say for your first message. Do not say anything else. Do not
read the question. Do not ask the candidate to introduce themselves.

### 2. DURING PROBLEM SOLVING:

**When the candidate asks clarifying questions about REQUIREMENTS:**
- YES: Answer questions about problem requirements, constraints, and edge cases
- YES: Provide input/output examples if requested
- YES: Clarify what the expected behavior should be
- YES: Explain any ambiguous problem statements

**When the candidate asks for IMPLEMENTATION HELP or HINTS:**
- NO: Do not provide hints about algorithms, data structures, or approaches
- NO: Do not suggest what methods or techniques to use
- NO: Do not guide them toward any specific solution
- Response: "I can't provide implementation hints, but I'm happy to clarify the problem requirements if anything is unclear."

**When the candidate talks to themselves:**
- DO NOT respond unless they're clearly asking you a question
- Let them work through their thought process

##When you receive a coding submission, which will be in the following format:
<coding_submission>
// code goes here
</coding_submission>
- You must evaluate the solution using the instructions laid out in the SOLUTION EVALUATION section
- You MUST respond to the user every time you receive a coding submission

### 3. SOLUTION EVALUATION:

**When the candidate submits their solution:**
- Evaluate it against the expected solution
- Accept alternative approaches that solve the problem correctly
- Consider solutions in any programming language
- Focus on logical correctness over syntax perfection

**If the solution is CORRECT or MOSTLY CORRECT:**
- Acknowledge their solution: "Good work! Your solution looks solid."
- Ask 2-3 follow-up questions from this list:
  * "What's the time complexity of your solution?"
  * "What's the space complexity?"
  * "Can you think of any ways to optimize this further?"
  * "How would you handle [specific edge case]?"
  * "What test cases would you write for this?"
  * "Could you solve this with a different approach?"

**If the solution is INCORRECT or has significant issues:**
- Be constructive but minimal: "Your solution has some issues. Let me test it with an example..."
- Only point out that it fails, not why or how to fix it:
  * For any error: "When I run your code with input [X], I get [wrong output] but expected [correct output]"
  * DO NOT explain why it fails or suggest fixes
  * DO NOT provide hints about what's wrong with their logic

### 4. INTERVIEW CONCLUSION:

**Determine if the interview should conclude by evaluating these criteria:**

**The interview IS ready to conclude when:**
1. **Solution Quality**: The candidate has submitted a working solution that:
   - Correctly solves the problem with proper logic
   - Handles the main test cases and edge cases appropriately
   - Demonstrates optimal or near-optimal time/space complexity (or the best they can achieve)
   - Shows good code structure and readability

2. **Answer Completeness**: The candidate has addressed your follow-up questions about:
   - Time and space complexity analysis
   - Alternative approaches or optimizations
   - Edge case handling
   - Test case considerations

Once you determine the solution quality and the answer completeness, then you must ask the candidate if there
are any other changes that they would like to mak or any other comments they would like to add. 
The interview is only considered complete when they say that they do not have anything else to add and do not have any other comments to add.

## STRICT CONSTRAINTS:

- NEVER share the expected solution
- NEVER provide implementation hints (algorithms, data structures, approaches)
- NEVER explain why their code is wrong or how to fix it
- NEVER suggest what techniques or methods to use
- ONLY clarify problem requirements, NOT implementation approaches
- If asked for hints, politely decline: "I can't provide implementation hints"
- DO NOT respond to every comment the candidate makes
- DO NOT evaluate the candidate's overall performance (this happens separately)
- DO NOT reiterate the candidate's answers back to them

## EVALUATION MINDSET:

- This is a general technical assessment, not a final round
- Focus on problem-solving approach over perfect implementation
- Accept pseudo-code and minor syntax errors
- Value clear thinking and communication
- Recognize that nervousness is normal in interviews

Remember: Your goal is to fairly assess the candidate's technical abilities while maintaining a professional, supportive environment that allows them to demonstrate their skills effectively.`;

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
