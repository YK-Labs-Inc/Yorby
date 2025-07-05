import { NextRequest, NextResponse } from "next/server";
import {
    AccessToken,
    type AccessTokenOptions,
    AgentDispatchClient,
    type VideoGrant,
} from "livekit-server-sdk";
import { createSupabaseServerClient } from "@/utils/supabase/server";

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

export async function GET(request: NextRequest) {
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
        const { data: { user }, error: userError } = await supabase.auth
            .getUser();

        if (userError || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get mockInterviewId from query params
        const searchParams = request.nextUrl.searchParams;
        const mockInterviewId = searchParams.get("mockInterviewId");

        if (!mockInterviewId) {
            return new NextResponse("mockInterviewId is required", {
                status: 400,
            });
        }

        // Fetch the mock interview to get the interview prompt
        const { data: mockInterview, error: mockInterviewError } = await supabase
            .from("custom_job_mock_interviews")
            .select("interview_prompt")
            .eq("id", mockInterviewId)
            .single();

        if (mockInterviewError || !mockInterview) {
            return new NextResponse("Mock interview not found", { status: 404 });
        }

        // Generate participant token
        const participantName = user.user_metadata?.full_name || user.email ||
            "User";
        const participantIdentity = user.id;
        const roomName = mockInterviewId;
        const participantToken = await createParticipantToken(
            {
                identity: participantIdentity,
                name: participantName,
            },
            roomName,
        );

        // Create agent dispatch after room and participant are set up
        const agentName = "interview_assistant";
        const agentDispatchClient = new AgentDispatchClient(
            LIVEKIT_URL,
            API_KEY,
            API_SECRET,
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
                    }),
                },
            );
            console.log("Created agent dispatch:", dispatch);
        } catch (error) {
            console.error("Failed to create agent dispatch:", error);
            // Continue even if dispatch fails - the agent might join through other means
        }

        // Return connection details
        const data: ConnectionDetails = {
            serverUrl: LIVEKIT_URL,
            roomName,
            participantToken: participantToken,
            participantName,
        };
        const headers = new Headers({
            "Cache-Control": "no-store",
        });
        return NextResponse.json(data, { headers });
    } catch (error) {
        if (error instanceof Error) {
            console.error(error);
            return new NextResponse(error.message, { status: 500 });
        }
    }
}

function createParticipantToken(
    userInfo: AccessTokenOptions,
    roomName: string,
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
