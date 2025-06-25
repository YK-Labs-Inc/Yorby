import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { AxiomRequest, withAxiom } from "next-axiom";

export const POST = withAxiom(async (req: AxiomRequest) => {
    const supabase = await createAdminClient();
    const logger = req.log.with({
        path: "/api/admin/migrate-mock-interviews",
    });

    try {
        logger.info(
            "Starting bulk mock interview migration for all jobs with source_custom_job_id",
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
                totalInterviews: 0,
            });
        }

        logger.info(`Found ${customJobs.length} custom jobs to process`);

        let totalMigratedCount = 0;
        let totalInterviewsCount = 0;
        const jobSummaries: any[] = [];
        const allErrors: any[] = [];

        // Step 2: Process each custom job
        for (const customJob of customJobs) {
            if (!customJob.source_custom_job_id) {
                logger.info("Skipping job with no source_custom_job_id", {
                    custom_job_id: customJob.id,
                });
                continue;
            }

            const jobErrors: any[] = [];
            let jobMigratedCount = 0;

            // Find all mock interviews for this custom_job
            const { data: mockInterviews, error: fetchError } = await supabase
                .from("custom_job_mock_interviews")
                .select("*")
                .eq("custom_job_id", customJob.id);

            if (fetchError) {
                logger.error("Error fetching mock interviews for job", {
                    error: fetchError,
                    custom_job_id: customJob.id,
                });
                jobErrors.push({
                    custom_job_id: customJob.id,
                    error:
                        `Failed to fetch mock interviews: ${fetchError.message}`,
                });
                continue;
            }

            if (!mockInterviews || mockInterviews.length === 0) {
                logger.info("No mock interviews found for job", {
                    custom_job_id: customJob.id,
                });
                jobSummaries.push({
                    custom_job_id: customJob.id,
                    job_title: customJob.job_title,
                    company_name: customJob.company_name,
                    interviews_found: 0,
                    migrated: 0,
                    errors: 0,
                });
                continue;
            }

            totalInterviewsCount += mockInterviews.length;

            // Update each mock interview
            for (const interview of mockInterviews) {
                try {
                    // Update the interview with the new custom_job_id and user_id
                    const { error: updateError } = await supabase
                        .from("custom_job_mock_interviews")
                        .update({
                            custom_job_id: customJob.source_custom_job_id,
                            user_id: customJob.user_id,
                        })
                        .eq("id", interview.id);

                    if (updateError) {
                        logger.error("Error updating mock interview", {
                            error: updateError,
                            interviewId: interview.id,
                            targetCustomJobId: customJob.source_custom_job_id,
                            targetUserId: customJob.user_id,
                            originalCustomJobId: customJob.id,
                        });
                        jobErrors.push({
                            interviewId: interview.id,
                            custom_job_id: customJob.id,
                            error: updateError.message,
                        });
                        continue;
                    }

                    logger.info("Successfully updated mock interview", {
                        interviewId: interview.id,
                        oldCustomJobId: customJob.id,
                        newCustomJobId: customJob.source_custom_job_id,
                        oldUserId: interview.user_id,
                        newUserId: customJob.user_id,
                    });
                    jobMigratedCount++;
                    totalMigratedCount++;
                } catch (error) {
                    logger.error(
                        "Unexpected error during mock interview migration",
                        {
                            error,
                            interviewId: interview.id,
                            custom_job_id: customJob.id,
                        },
                    );
                    jobErrors.push({
                        interviewId: interview.id,
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
                parent_user_id: customJob.user_id,
                interviews_found: mockInterviews.length,
                migrated: jobMigratedCount,
                errors: jobErrors.length,
            });

            // Add job errors to all errors
            allErrors.push(...jobErrors);
        }

        // Generate overall summary
        const summary = {
            totalJobs: customJobs.length,
            totalInterviews: totalInterviewsCount,
            totalMigrated: totalMigratedCount,
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
        path: "/api/admin/migrate-mock-interviews",
    });

    try {
        // Get query parameters
        const { searchParams } = new URL(req.url);
        const custom_job_id = searchParams.get("custom_job_id");
        const mode = searchParams.get("mode") || "single"; // "single" or "bulk"

        // If mode is single and custom_job_id is provided, show preview for specific job
        if (mode === "single" && custom_job_id) {
            // Get custom job details
            const { data: customJob, error: jobError } = await supabase
                .from("custom_jobs")
                .select(
                    "id, source_custom_job_id, user_id, job_title, company_name",
                )
                .eq("id", custom_job_id)
                .single();

            if (jobError) {
                logger.error("Error fetching custom job", {
                    error: jobError,
                    custom_job_id,
                });
                return NextResponse.json({
                    error: "Failed to fetch custom job",
                    details: jobError.message,
                }, { status: 500 });
            }

            if (!customJob.source_custom_job_id) {
                return NextResponse.json({
                    mode: "single",
                    custom_job_id,
                    message:
                        "No source_custom_job_id found - no migration needed",
                    totalInterviews: 0,
                    preview: [],
                });
            }

            // Get preview of mock interviews that would be migrated
            const { data: mockInterviews, error: fetchError } = await supabase
                .from("custom_job_mock_interviews")
                .select(`
                    id,
                    user_id,
                    status,
                    created_at,
                    interview_prompt,
                    recording_file_path
                `)
                .eq("custom_job_id", custom_job_id);

            if (fetchError) {
                logger.error("Error fetching mock interviews preview", {
                    error: fetchError,
                });
                return NextResponse.json({
                    error: "Failed to fetch mock interviews",
                    details: fetchError.message,
                }, { status: 500 });
            }

            // Build preview data
            const preview = mockInterviews?.map((interview) => ({
                interview_id: interview.id,
                current_user_id: interview.user_id,
                target_user_id: customJob.user_id,
                current_custom_job_id: custom_job_id,
                target_custom_job_id: customJob.source_custom_job_id,
                status: interview.status,
                has_recording: !!interview.recording_file_path,
                created_at: interview.created_at,
                job_title: customJob.job_title,
                company_name: customJob.company_name,
            })) || [];

            return NextResponse.json({
                mode: "single",
                custom_job_id,
                source_custom_job_id: customJob.source_custom_job_id,
                source_user_id: customJob.user_id,
                totalInterviews: mockInterviews?.length || 0,
                preview,
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
                totalInterviews: 0,
                jobPreviews: [],
            });
        }

        let totalInterviewsCount = 0;
        const jobPreviews: any[] = [];

        // Process each custom job
        for (const customJob of customJobs) {
            // Find all mock interviews for this custom_job
            const { data: mockInterviews, error: fetchError } = await supabase
                .from("custom_job_mock_interviews")
                .select("id")
                .eq("custom_job_id", customJob.id);

            if (fetchError) {
                logger.error("Error fetching mock interviews for job", {
                    error: fetchError,
                    custom_job_id: customJob.id,
                });
                continue;
            }

            const interviewCount = mockInterviews?.length || 0;
            totalInterviewsCount += interviewCount;

            if (interviewCount > 0) {
                jobPreviews.push({
                    custom_job_id: customJob.id,
                    job_title: customJob.job_title,
                    company_name: customJob.company_name,
                    source_custom_job_id: customJob.source_custom_job_id,
                    parent_user_id: customJob.user_id,
                    interviews_to_migrate: interviewCount,
                });
            }
        }

        return NextResponse.json({
            mode: "bulk",
            totalJobs: customJobs.length,
            jobsWithInterviews: jobPreviews.length,
            totalInterviews: totalInterviewsCount,
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
