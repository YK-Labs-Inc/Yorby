import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { AxiomRequest, withAxiom } from "next-axiom";

interface CleanupOptions {
    deleteQuestions?: boolean;
    deleteJobs?: boolean;
    dryRun?: boolean;
}

export const POST = withAxiom(async (req: AxiomRequest) => {
    const supabase = await createAdminClient();
    const logger = req.log.with({
        path: "/api/admin/migrate-enrollments-cleanup",
    });

    try {
        // Parse cleanup options from request body
        const options: CleanupOptions = await req.json().catch(() => ({}));
        const {
            deleteQuestions = false,
            deleteJobs = false,
            dryRun = true, // Default to dry run for safety
        } = options;

        // Verify admin access
        const authHeader = req.headers.get('x-admin-secret');
        const adminSecret = process.env.ADMIN_SECRET;
        
        if (adminSecret && authHeader !== adminSecret) {
            logger.error("Invalid admin credentials");
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
            });
        }

        logger.info("Starting enrollment cleanup", {
            options: { deleteQuestions, deleteJobs, dryRun },
        });

        const cleanup = {
            questionsToDelete: [] as string[],
            jobsToDelete: [] as string[],
            questionsDeleted: 0,
            jobsDeleted: 0,
            errors: [] as any[],
        };

        // Step 1: Find all legacy questions that can be deleted
        if (deleteQuestions) {
            const { data: legacyQuestions, error: questionsError } =
                await supabase
                    .from("custom_job_questions")
                    .select(`
                    id,
                    custom_job_id,
                    source_custom_job_question_id,
                    question
                `)
                    .not("source_custom_job_question_id", "is", null);

            if (questionsError) {
                logger.error("Error fetching legacy questions", {
                    error: questionsError,
                });
                cleanup.errors.push({
                    step: "fetch_questions",
                    error: questionsError.message,
                });
            } else if (legacyQuestions) {
                cleanup.questionsToDelete = legacyQuestions.map((q) => q.id);
                logger.info(
                    `Found ${legacyQuestions.length} legacy questions to delete`,
                );

                if (!dryRun && legacyQuestions.length > 0) {
                    // Delete in batches to avoid timeout
                    const batchSize = 100;
                    for (
                        let i = 0; i < legacyQuestions.length; i += batchSize
                    ) {
                        const batch = legacyQuestions
                            .slice(i, i + batchSize)
                            .map((q) => q.id);

                        const { error: deleteError } = await supabase
                            .from("custom_job_questions")
                            .delete()
                            .in("id", batch);

                        if (deleteError) {
                            logger.error("Error deleting questions batch", {
                                error: deleteError,
                                batchStart: i,
                                batchSize: batch.length,
                            });
                            cleanup.errors.push({
                                step: "delete_questions",
                                batch: i,
                                error: deleteError.message,
                            });
                        } else {
                            cleanup.questionsDeleted += batch.length;
                            logger.info(
                                `Deleted questions batch ${i / batchSize + 1}`,
                                {
                                    deletedCount: batch.length,
                                },
                            );
                        }
                    }
                }
            }
        }

        // Step 2: Find all legacy jobs that can be deleted
        if (deleteJobs) {
            // First ensure all enrollments have been migrated
            const { data: unmigrated, error: unmigratedError } = await supabase
                .from("custom_jobs")
                .select("id, user_id, coach_id, source_custom_job_id")
                .not("source_custom_job_id", "is", null)
                .is("id", null); // This checks if there's a corresponding enrollment

            if (!unmigratedError && unmigrated && unmigrated.length > 0) {
                logger.warn("Found unmigrated legacy jobs", {
                    count: unmigrated.length,
                });
                cleanup.errors.push({
                    step: "verify_migration",
                    error:
                        `Found ${unmigrated.length} unmigrated legacy jobs. Run migration first.`,
                });

                if (!dryRun) {
                    // Don't proceed with job deletion if there are unmigrated jobs
                    return NextResponse.json({
                        error: "Cannot delete jobs - migration incomplete",
                        ...cleanup,
                    }, { status: 400 });
                }
            }

            // Get all legacy jobs
            const { data: legacyJobs, error: jobsError } = await supabase
                .from("custom_jobs")
                .select(`
                    id,
                    user_id,
                    coach_id,
                    source_custom_job_id,
                    job_title
                `)
                .not("source_custom_job_id", "is", null);

            if (jobsError) {
                logger.error("Error fetching legacy jobs", {
                    error: jobsError,
                });
                cleanup.errors.push({
                    step: "fetch_jobs",
                    error: jobsError.message,
                });
            } else if (legacyJobs) {
                cleanup.jobsToDelete = legacyJobs.map((j) => j.id);
                logger.info(`Found ${legacyJobs.length} legacy jobs to delete`);

                if (!dryRun && legacyJobs.length > 0) {
                    // Delete in batches
                    const batchSize = 50;
                    for (let i = 0; i < legacyJobs.length; i += batchSize) {
                        const batch = legacyJobs
                            .slice(i, i + batchSize)
                            .map((j) => j.id);

                        const { error: deleteError } = await supabase
                            .from("custom_jobs")
                            .delete()
                            .in("id", batch);

                        if (deleteError) {
                            logger.error("Error deleting jobs batch", {
                                error: deleteError,
                                batchStart: i,
                                batchSize: batch.length,
                            });
                            cleanup.errors.push({
                                step: "delete_jobs",
                                batch: i,
                                error: deleteError.message,
                            });
                        } else {
                            cleanup.jobsDeleted += batch.length;
                            logger.info(
                                `Deleted jobs batch ${i / batchSize + 1}`,
                                {
                                    deletedCount: batch.length,
                                },
                            );
                        }
                    }
                }
            }
        }

        const summary = {
            dryRun,
            questionsToDelete: cleanup.questionsToDelete.length,
            questionsDeleted: cleanup.questionsDeleted,
            jobsToDelete: cleanup.jobsToDelete.length,
            jobsDeleted: cleanup.jobsDeleted,
            errors: cleanup.errors.length > 0 ? cleanup.errors : undefined,
        };

        logger.info("Cleanup completed", summary);

        return NextResponse.json({
            message: dryRun
                ? "Dry run completed - no data was deleted"
                : "Cleanup completed",
            ...summary,
        });
    } catch (error) {
        logger.error("Fatal error during cleanup", { error });
        return NextResponse.json({
            error: "Cleanup failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 });
    }
});