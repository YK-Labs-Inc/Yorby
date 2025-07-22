import { NextRequest, NextResponse } from "next/server";
import {
  AccessToken,
  type AccessTokenOptions,
  AgentDispatchClient,
  type VideoGrant,
} from "livekit-server-sdk";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { withAxiom, AxiomRequest } from "next-axiom";

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

    if (!mockInterviewId) {
      log.warn("Missing mockInterviewId in request");
      return new NextResponse("mockInterviewId is required", {
        status: 400,
      });
    }

    log.info("Fetching mock interview", { mockInterviewId, userId: user.id });

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
      return new NextResponse("Mock interview not found", { status: 404 });
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
            interview_prompt: mockInterview.interview_prompt,
            mock_interview_id: mockInterviewId,
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

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string
) {
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
}
