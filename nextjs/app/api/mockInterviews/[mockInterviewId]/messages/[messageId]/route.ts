import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { AxiomRequest, withAxiom } from "next-axiom";
export const PATCH = withAxiom(
    async (
        req: AxiomRequest,
        { params }: {
            params: Promise<{ mockInterviewId: string; messageId: string }>;
        },
    ) => {
        let logger = req.log.with({
            path: "/api/mockInterviews/[mockInterviewId]/messages/[messageId]",
            method: "PATCH",
        });
        const { mockInterviewId, messageId } = await params;
        logger = logger.with({
            mockInterviewId,
            messageId,
        });
        try {
            const { bucket_name, recording_path } = await req.json();
            if (!bucket_name || !recording_path) {
                return NextResponse.json({
                    error: "Missing bucket_name or recording_path",
                }, { status: 400 });
            }
            const supabase = await createSupabaseServerClient();
            const { error } = await supabase
                .from("mock_interview_messages")
                .update({ bucket_name, recording_path })
                .eq("id", messageId);
            if (error) {
                logger.error("Supabase update error:", {
                    error: error.message,
                });
                return NextResponse.json({ error: error.message }, {
                    status: 500,
                });
            }
            return NextResponse.json({ success: true });
        } catch (err: any) {
            logger.error("API route error:", {
                error: err.message,
            });
            return NextResponse.json(
                { error: err.message || "Unknown error" },
                {
                    status: 500,
                },
            );
        }
    },
);
