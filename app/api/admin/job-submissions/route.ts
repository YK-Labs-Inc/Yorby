import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { AxiomRequest, withAxiom } from "next-axiom";

export const GET = withAxiom(async (req: AxiomRequest) => {
    const supabase = await createAdminClient();
    const logger = req.log.with({
        path: "/api/admin/job-submissions",
    });

    try {
        // Get custom_job_id from query parameters
        const { searchParams } = new URL(req.url);
        const custom_job_id = searchParams.get("custom_job_id");

        if (!custom_job_id) {
            logger.error("Missing custom_job_id in query parameters");
            return NextResponse.json({
                error: "custom_job_id is required",
            }, { status: 400 });
        }

        logger.info("Fetching submissions for custom job", { custom_job_id });

        // Fetch all submissions for questions belonging to this custom job
        const { data: submissions, error: fetchError } = await supabase
            .from("custom_job_question_submissions")
            .select(`
                id,
                custom_job_question_id,
                user_id,
                answer,
                audio_file_path,
                audio_bucket,
                audio_recording_duration,
                feedback,
                created_at,
                custom_job_questions!inner(
                    id,
                    question,
                    custom_job_id,
                    source_custom_job_question_id
                )
            `)
            .eq("custom_job_questions.custom_job_id", custom_job_id)
            .order("created_at", { ascending: false });

        if (fetchError) {
            logger.error("Error fetching submissions", {
                error: fetchError,
                custom_job_id,
            });
            return NextResponse.json({
                error: "Failed to fetch submissions",
                details: fetchError.message,
            }, { status: 500 });
        }

        // Get the custom job details
        const { data: customJob, error: jobError } = await supabase
            .from("custom_jobs")
            .select(`
                id,
                job_title,
                company_name,
                user_id,
                coach_id,
                source_custom_job_id,
                created_at
            `)
            .eq("id", custom_job_id)
            .single();

        if (jobError) {
            logger.error("Error fetching custom job", {
                error: jobError,
                custom_job_id,
            });
        }

        // Group submissions by user
        const submissionsByUser = submissions?.reduce((acc, submission) => {
            const userId = submission.user_id;
            if (!userId) return acc;

            if (!acc[userId]) {
                acc[userId] = {
                    user_id: userId,
                    submission_count: 0,
                    submissions: [],
                };
            }

            acc[userId].submission_count++;
            acc[userId].submissions.push({
                id: submission.id,
                question_id: submission.custom_job_question_id,
                question_text: submission.custom_job_questions.question,
                source_question_id: submission.custom_job_questions.source_custom_job_question_id,
                answer: submission.answer,
                audio_file_path: submission.audio_file_path,
                audio_bucket: submission.audio_bucket,
                audio_duration: submission.audio_recording_duration,
                has_feedback: !!submission.feedback,
                created_at: submission.created_at,
            });

            return acc;
        }, {} as Record<string, any>);

        // Calculate summary statistics
        const totalSubmissions = submissions?.length || 0;
        const uniqueUsers = Object.keys(submissionsByUser || {}).length;
        const submissionsWithAudio = submissions?.filter(s => s.audio_file_path).length || 0;
        const submissionsWithFeedback = submissions?.filter(s => s.feedback).length || 0;

        logger.info("Successfully fetched submissions", {
            custom_job_id,
            totalSubmissions,
            uniqueUsers,
        });

        return NextResponse.json({
            custom_job_id,
            job_details: customJob || null,
            summary: {
                total_submissions: totalSubmissions,
                unique_users: uniqueUsers,
                submissions_with_audio: submissionsWithAudio,
                submissions_with_feedback: submissionsWithFeedback,
            },
            submissions_by_user: Object.values(submissionsByUser || {}),
            raw_submissions: submissions?.map(s => ({
                id: s.id,
                user_id: s.user_id,
                question_id: s.custom_job_question_id,
                question_text: s.custom_job_questions.question,
            })),
        });
    } catch (error) {
        logger.error("Fatal error fetching submissions", { error });
        return NextResponse.json({
            error: "Failed to fetch submissions",
            details: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 });
    }
});