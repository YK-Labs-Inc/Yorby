import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { AxiomRequest, withAxiom } from "next-axiom";

export const POST = withAxiom(async (req: AxiomRequest) => {
    const supabase = await createAdminClient();
    const logger = req.log.with({
        path: "/api/admin/migrate-submissions",
    });

    try {
        logger.info(
            "Starting bulk submission migration for all jobs with source_custom_job_id",
        );

        // Step 1: Find all custom jobs that have a source_custom_job_id
        const { data: customJobs, error: jobsFetchError } = await supabase
            .from("custom_jobs")
            .select(
                "id, source_custom_job_id, user_id, job_title, company_name",
            )
            .not("source_custom_job_id", "is", null);

        if (jobsFetchError) {
            logger.error("Error fetching custom jobs", {
                error: jobsFetchError,
            });
            return NextResponse.json({
                error: "Failed to fetch custom jobs",
                details: jobsFetchError.message,
            }, { status: 500 });
        }

        if (!customJobs || customJobs.length === 0) {
            logger.info("No custom jobs with source_custom_job_id found");
            return NextResponse.json({
                message: "No custom jobs with source_custom_job_id found",
                totalJobs: 0,
                totalSubmissions: 0,
            });
        }

        logger.info(`Found ${customJobs.length} custom jobs to process`);

        let totalMigratedCount = 0;
        let totalSkippedCount = 0;
        let totalSubmissionsCount = 0;
        const jobSummaries: any[] = [];
        const allErrors: any[] = [];

        // Step 2: Process each custom job
        for (const customJob of customJobs) {
            const jobErrors: any[] = [];
            let jobMigratedCount = 0;
            let jobSkippedCount = 0;

            // Get the user_id from the parent custom job
            const parentUserId = customJob.user_id;

            // Find all submissions that need migration for this custom_job
            const { data: submissionsToMigrate, error: fetchError } =
                await supabase
                    .from("custom_job_question_submissions")
                    .select(`
                    id,
                    custom_job_question_id,
                    user_id,
                    custom_job_questions!inner(
                        id,
                        source_custom_job_question_id,
                        custom_job_id
                    )
                `)
                    .eq("custom_job_questions.custom_job_id", customJob.id)
                    .not(
                        "custom_job_questions.source_custom_job_question_id",
                        "is",
                        null,
                    );

            if (fetchError) {
                logger.error("Error fetching submissions for job", {
                    error: fetchError,
                    custom_job_id: customJob.id,
                });
                jobErrors.push({
                    custom_job_id: customJob.id,
                    error: `Failed to fetch submissions: ${fetchError.message}`,
                });
                continue;
            }

            if (!submissionsToMigrate || submissionsToMigrate.length === 0) {
                logger.info("No submissions found to migrate for job", {
                    custom_job_id: customJob.id,
                });
                jobSummaries.push({
                    custom_job_id: customJob.id,
                    job_title: customJob.job_title,
                    company_name: customJob.company_name,
                    submissions_found: 0,
                    migrated: 0,
                    skipped: 0,
                    errors: 0,
                });
                continue;
            }

            totalSubmissionsCount += submissionsToMigrate.length;

            // Update each submission
            for (const submission of submissionsToMigrate) {
                try {
                    const sourceQuestionId = submission.custom_job_questions
                        .source_custom_job_question_id;

                    if (!sourceQuestionId) {
                        logger.warn(
                            "Skipping submission with null source_custom_job_question_id",
                            {
                                submissionId: submission.id,
                                custom_job_id: customJob.id,
                            },
                        );
                        jobSkippedCount++;
                        totalSkippedCount++;
                        continue;
                    }

                    // Update the submission with the source question ID and parent job's user_id
                    const { error: updateError } = await supabase
                        .from("custom_job_question_submissions")
                        .update({
                            custom_job_question_id: sourceQuestionId,
                            user_id: parentUserId,
                        })
                        .eq("id", submission.id);

                    if (updateError) {
                        logger.error("Error updating submission", {
                            error: updateError,
                            submissionId: submission.id,
                            sourceQuestionId,
                            parentUserId,
                            custom_job_id: customJob.id,
                        });
                        jobErrors.push({
                            submissionId: submission.id,
                            custom_job_id: customJob.id,
                            error: updateError.message,
                        });
                        continue;
                    }

                    logger.info("Successfully updated submission", {
                        submissionId: submission.id,
                        oldQuestionId: submission.custom_job_question_id,
                        newQuestionId: sourceQuestionId,
                        oldUserId: submission.user_id,
                        newUserId: parentUserId,
                        custom_job_id: customJob.id,
                    });
                    jobMigratedCount++;
                    totalMigratedCount++;
                } catch (error) {
                    logger.error("Unexpected error during submission update", {
                        error,
                        submissionId: submission.id,
                        custom_job_id: customJob.id,
                    });
                    jobErrors.push({
                        submissionId: submission.id,
                        custom_job_id: customJob.id,
                        error: error instanceof Error
                            ? error.message
                            : "Unknown error",
                    });
                }
            }

            // Add job summary
            jobSummaries.push({
                custom_job_id: customJob.id,
                job_title: customJob.job_title,
                company_name: customJob.company_name,
                source_custom_job_id: customJob.source_custom_job_id,
                parent_user_id: parentUserId,
                submissions_found: submissionsToMigrate.length,
                migrated: jobMigratedCount,
                skipped: jobSkippedCount,
                errors: jobErrors.length,
            });

            // Add job errors to all errors
            allErrors.push(...jobErrors);
        }

        // Generate overall summary
        const summary = {
            totalJobs: customJobs.length,
            totalSubmissions: totalSubmissionsCount,
            totalMigrated: totalMigratedCount,
            totalSkipped: totalSkippedCount,
            totalErrors: allErrors.length,
            jobSummaries,
            errors: allErrors.length > 0 ? allErrors : undefined,
        };

        logger.info("Bulk migration completed", summary);

        return NextResponse.json({
            message: "Bulk migration completed",
            ...summary,
        });
    } catch (error) {
        logger.error("Fatal error during bulk migration", { error });
        return NextResponse.json({
            error: "Bulk migration failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 });
    }
});

// GET endpoint to preview what would be migrated (supports both specific job and bulk)
export const GET = withAxiom(async (req: AxiomRequest) => {
    const supabase = await createAdminClient();
    const logger = req.log.with({
        path: "/api/admin/migrate-submissions",
    });

    try {
        // Get query parameters
        const { searchParams } = new URL(req.url);
        const custom_job_id = searchParams.get("custom_job_id");
        const mode = searchParams.get("mode") || "single"; // "single" or "bulk"

        // If mode is single and custom_job_id is provided, show preview for specific job
        if (mode === "single" && custom_job_id) {
            // Get preview of submissions that would be migrated for the specified custom_job
            const { data: submissionsToMigrate, error: fetchError } =
                await supabase
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
                    .eq("custom_job_questions.custom_job_id", custom_job_id)
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
                        current_user_id: submission.user_id,
                        target_user_id:
                            submission.custom_job_questions.custom_jobs.user_id,
                        question_text: submission.custom_job_questions.question,
                        job_title:
                            submission.custom_job_questions.custom_jobs
                                .job_title,
                        company_name:
                            submission.custom_job_questions.custom_jobs
                                .company_name,
                        coach_id:
                            submission.custom_job_questions.custom_jobs
                                .coach_id,
                        created_at: submission.created_at,
                    });

                    return acc;
                },
                {} as Record<string, any>,
            );

            return NextResponse.json({
                mode: "single",
                custom_job_id,
                totalSubmissions: submissionsToMigrate?.length || 0,
                uniqueUsers: Object.keys(migrationPreview || {}).length,
                preview: Object.values(migrationPreview || {}),
            });
        }

        // Bulk mode - show preview for all jobs with source_custom_job_id
        logger.info("Generating bulk migration preview");

        // Find all custom jobs that have a source_custom_job_id
        const { data: customJobs, error: jobsFetchError } = await supabase
            .from("custom_jobs")
            .select(
                "id, source_custom_job_id, user_id, job_title, company_name",
            )
            .not("source_custom_job_id", "is", null);

        if (jobsFetchError) {
            logger.error("Error fetching custom jobs", {
                error: jobsFetchError,
            });
            return NextResponse.json({
                error: "Failed to fetch custom jobs",
                details: jobsFetchError.message,
            }, { status: 500 });
        }

        if (!customJobs || customJobs.length === 0) {
            return NextResponse.json({
                mode: "bulk",
                message: "No custom jobs with source_custom_job_id found",
                totalJobs: 0,
                totalSubmissions: 0,
                jobPreviews: [],
            });
        }

        let totalSubmissionsCount = 0;
        const jobPreviews: any[] = [];

        // Process each custom job
        for (const customJob of customJobs) {
            // Find all submissions that need migration for this custom_job
            const { data: submissionsToMigrate, error: fetchError } =
                await supabase
                    .from("custom_job_question_submissions")
                    .select(`
                    id,
                    custom_job_question_id,
                    user_id,
                    custom_job_questions!inner(
                        id,
                        source_custom_job_question_id,
                        custom_job_id
                    )
                `)
                    .eq("custom_job_questions.custom_job_id", customJob.id)
                    .not(
                        "custom_job_questions.source_custom_job_question_id",
                        "is",
                        null,
                    );

            if (fetchError) {
                logger.error("Error fetching submissions for job", {
                    error: fetchError,
                    custom_job_id: customJob.id,
                });
                continue;
            }

            const submissionCount = submissionsToMigrate?.length || 0;
            totalSubmissionsCount += submissionCount;

            if (submissionCount > 0) {
                jobPreviews.push({
                    custom_job_id: customJob.id,
                    job_title: customJob.job_title,
                    company_name: customJob.company_name,
                    source_custom_job_id: customJob.source_custom_job_id,
                    parent_user_id: customJob.user_id,
                    submissions_to_migrate: submissionCount,
                });
            }
        }

        return NextResponse.json({
            mode: "bulk",
            totalJobs: customJobs.length,
            jobsWithSubmissions: jobPreviews.length,
            totalSubmissions: totalSubmissionsCount,
            jobPreviews,
        });
    } catch (error) {
        logger.error("Error generating migration preview", { error });
        return NextResponse.json({
            error: "Failed to generate preview",
            details: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 });
    }
});
