import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { AxiomRequest, withAxiom } from "next-axiom";

export const POST = withAxiom(async (req: AxiomRequest) => {
    const supabase = await createAdminClient();
    const logger = req.log.with({
        path: "/api/admin/migrate-submissions",
    });

    try {
        logger.info("Starting submission migration");

        // Step 1: Find all submissions that need migration
        // These are submissions where the question has a source_custom_job_question_id
        const { data: submissionsToMigrate, error: fetchError } = await supabase
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
                    source_custom_job_question_id,
                    custom_job_id
                )
            `)
            .not(
                "custom_job_questions.source_custom_job_question_id",
                "is",
                null,
            );

        if (fetchError) {
            logger.error("Error fetching submissions to migrate", {
                error: fetchError,
            });
            return NextResponse.json({
                error: "Failed to fetch submissions",
                details: fetchError.message,
            }, { status: 500 });
        }

        if (!submissionsToMigrate || submissionsToMigrate.length === 0) {
            logger.info("No submissions found to migrate");
            return NextResponse.json({
                message: "No submissions found to migrate",
                migratedCount: 0,
            });
        }

        logger.info(
            `Found ${submissionsToMigrate.length} submissions to migrate`,
        );

        let migratedCount = 0;
        let skippedCount = 0;
        const errors: any[] = [];

        // Step 2: Update each submission to point to the source question
        for (const submission of submissionsToMigrate) {
            try {
                const sourceQuestionId = submission.custom_job_questions
                    .source_custom_job_question_id;

                if (!sourceQuestionId) {
                    logger.warn(
                        "Skipping submission with null source_custom_job_question_id",
                        {
                            submissionId: submission.id,
                        },
                    );
                    skippedCount++;
                    continue;
                }

                // Update the submission to point to the source question
                const { error: updateError } = await supabase
                    .from("custom_job_question_submissions")
                    .update({
                        custom_job_question_id: sourceQuestionId,
                    })
                    .eq("id", submission.id);

                if (updateError) {
                    logger.error("Error updating submission", {
                        error: updateError,
                        submissionId: submission.id,
                        sourceQuestionId,
                    });
                    errors.push({
                        submissionId: submission.id,
                        error: updateError.message,
                    });
                    continue;
                }

                logger.info("Successfully migrated submission", {
                    submissionId: submission.id,
                    oldQuestionId: submission.custom_job_question_id,
                    newQuestionId: sourceQuestionId,
                    userId: submission.user_id,
                });
                migratedCount++;
            } catch (error) {
                logger.error("Unexpected error during submission migration", {
                    error,
                    submissionId: submission.id,
                });
                errors.push({
                    submissionId: submission.id,
                    error: error instanceof Error
                        ? error.message
                        : "Unknown error",
                });
            }
        }

        // Generate summary
        const summary = {
            totalSubmissions: submissionsToMigrate.length,
            migratedCount,
            skippedCount,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined,
        };

        logger.info("Migration completed", summary);

        return NextResponse.json({
            message: "Migration completed",
            ...summary,
        });
    } catch (error) {
        logger.error("Fatal error during migration", { error });
        return NextResponse.json({
            error: "Migration failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 });
    }
});

// GET endpoint to preview what would be migrated
export const GET = withAxiom(async (req: AxiomRequest) => {
    const supabase = await createAdminClient();
    const logger = req.log.with({
        path: "/api/admin/migrate-submissions",
    });

    try {
        // For admin endpoints, verify admin secret
        const authHeader = req.headers.get("x-admin-secret");
        const adminSecret = process.env.ADMIN_SECRET;

        if (adminSecret && authHeader !== adminSecret) {
            logger.error("Invalid admin credentials");
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
            });
        }

        // Get preview of submissions that would be migrated
        const { data: submissionsToMigrate, error: fetchError } = await supabase
            .from("custom_job_question_submissions")
            .select(`
                id,
                custom_job_question_id,
                user_id,
                created_at,
                custom_job_questions!inner(
                    id,
                    source_custom_job_question_id,
                    question,
                    custom_job_id,
                    custom_jobs!inner(
                        id,
                        job_title,
                        company_name,
                        user_id,
                        coach_id
                    )
                )
            `)
            .not(
                "custom_job_questions.source_custom_job_question_id",
                "is",
                null,
            );

        if (fetchError) {
            logger.error("Error fetching submissions preview", {
                error: fetchError,
            });
            return NextResponse.json({
                error: "Failed to fetch submissions",
                details: fetchError.message,
            }, { status: 500 });
        }

        // Group by user for better visibility
        const migrationPreview = submissionsToMigrate?.reduce(
            (acc, submission) => {
                const userId = submission.user_id;
                if (!userId) return acc;

                if (!acc[userId]) {
                    acc[userId] = {
                        user_id: userId,
                        submissions: [],
                    };
                }

                acc[userId].submissions.push({
                    submission_id: submission.id,
                    current_question_id: submission.custom_job_question_id,
                    target_question_id: submission.custom_job_questions
                        .source_custom_job_question_id,
                    question_text: submission.custom_job_questions.question,
                    job_title:
                        submission.custom_job_questions.custom_jobs.job_title,
                    company_name: submission.custom_job_questions.custom_jobs
                        .company_name,
                    coach_id:
                        submission.custom_job_questions.custom_jobs.coach_id,
                    created_at: submission.created_at,
                });

                return acc;
            },
            {} as Record<string, any>,
        );

        return NextResponse.json({
            totalSubmissions: submissionsToMigrate?.length || 0,
            uniqueUsers: Object.keys(migrationPreview || {}).length,
            preview: Object.values(migrationPreview || {}),
        });
    } catch (error) {
        logger.error("Error generating migration preview", { error });
        return NextResponse.json({
            error: "Failed to generate preview",
            details: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 });
    }
});
