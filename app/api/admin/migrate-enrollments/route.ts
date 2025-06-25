import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { AxiomRequest, withAxiom } from "next-axiom";

export const POST = withAxiom(async (req: AxiomRequest) => {
    const supabase = await createAdminClient();
    const logger = req.log.with({
        path: "/api/admin/migrate-enrollments",
    });

    try {
        logger.info("Starting enrollment migration");

        // Get all legacy duplicated jobs (jobs with source_custom_job_id)
        const { data: legacyJobs, error: legacyJobsError } = await supabase
            .from("custom_jobs")
            .select(`
                id,
                user_id,
                coach_id,
                source_custom_job_id,
                created_at
            `)
            .not("source_custom_job_id", "is", null);

        if (legacyJobsError) {
            logger.error("Error fetching legacy jobs", {
                error: legacyJobsError,
            });
            return NextResponse.json({
                error: "Failed to fetch legacy jobs",
            }, { status: 500 });
        }

        if (!legacyJobs || legacyJobs.length === 0) {
            logger.info("No legacy jobs found to migrate");
            return NextResponse.json({
                message: "No legacy enrollments found to migrate",
                migratedCount: 0,
            });
        }

        logger.info(`Found ${legacyJobs.length} legacy jobs to migrate`);

        let migratedCount = 0;
        let skippedCount = 0;
        const errors: any[] = [];

        // Process each legacy job
        for (const legacyJob of legacyJobs) {
            try {
                // Skip if source_custom_job_id is null (shouldn't happen based on our query)
                if (!legacyJob.source_custom_job_id || !legacyJob.coach_id) {
                    logger.warn(
                        "Skipping job with null source_custom_job_id or coach_id",
                        {
                            legacyJobId: legacyJob.id,
                            sourceJobId: legacyJob.source_custom_job_id,
                            coachId: legacyJob.coach_id,
                        },
                    );
                    skippedCount++;
                    continue;
                }

                // Check if enrollment already exists
                const { data: existingEnrollment } = await supabase
                    .from("custom_job_enrollments")
                    .select("id")
                    .eq("user_id", legacyJob.user_id)
                    .eq("custom_job_id", legacyJob.source_custom_job_id)
                    .eq("coach_id", legacyJob.coach_id)
                    .maybeSingle();

                if (existingEnrollment) {
                    logger.info("Enrollment already exists, skipping", {
                        userId: legacyJob.user_id,
                        customJobId: legacyJob.source_custom_job_id,
                        coachId: legacyJob.coach_id,
                    });
                    skippedCount++;
                    continue;
                }

                // Create new enrollment
                const { error: enrollmentError } = await supabase
                    .from("custom_job_enrollments")
                    .insert({
                        user_id: legacyJob.user_id,
                        custom_job_id: legacyJob.source_custom_job_id,
                        coach_id: legacyJob.coach_id,
                        created_at: legacyJob.created_at, // Preserve original enrollment date
                    });

                if (enrollmentError) {
                    logger.error("Error creating enrollment", {
                        error: enrollmentError,
                        legacyJobId: legacyJob.id,
                        userId: legacyJob.user_id,
                        sourceJobId: legacyJob.source_custom_job_id,
                    });
                    errors.push({
                        legacyJobId: legacyJob.id,
                        error: enrollmentError.message,
                    });
                    continue;
                }

                logger.info("Successfully migrated enrollment", {
                    userId: legacyJob.user_id,
                    customJobId: legacyJob.source_custom_job_id,
                    coachId: legacyJob.coach_id,
                    legacyJobId: legacyJob.id,
                });
                migratedCount++;
            } catch (error) {
                logger.error("Unexpected error during enrollment migration", {
                    error,
                    legacyJobId: legacyJob.id,
                });
                errors.push({
                    legacyJobId: legacyJob.id,
                    error: error instanceof Error
                        ? error.message
                        : "Unknown error",
                });
            }
        }

        // Generate summary
        const summary = {
            totalLegacyJobs: legacyJobs.length,
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

// Optional: GET endpoint to preview what would be migrated
export const GET = withAxiom(async (req: AxiomRequest) => {
    const supabase = await createAdminClient();
    const logger = req.log.with({
        path: "/api/admin/migrate-enrollments",
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

        // Get preview of legacy jobs that would be migrated
        const { data: legacyJobs, error: legacyJobsError } = await supabase
            .from("custom_jobs")
            .select(`
                id,
                user_id,
                coach_id,
                source_custom_job_id,
                job_title,
                company_name,
                created_at
            `)
            .not("source_custom_job_id", "is", null);

        if (legacyJobsError) {
            logger.error("Error fetching legacy jobs", {
                error: legacyJobsError,
            });
            return NextResponse.json({
                error: "Failed to fetch legacy jobs",
            }, { status: 500 });
        }

        // Group by user and coach for better visibility
        const migrationPreview = legacyJobs?.reduce((acc, job) => {
            const key = `${job.user_id}_${job.coach_id}`;
            if (!acc[key]) {
                acc[key] = {
                    user_id: job.user_id,
                    coach_id: job.coach_id,
                    jobs: [],
                };
            }
            acc[key].jobs.push({
                legacy_job_id: job.id,
                source_job_id: job.source_custom_job_id,
                job_title: job.job_title,
                company_name: job.company_name,
                created_at: job.created_at,
            });
            return acc;
        }, {} as Record<string, any>);

        return NextResponse.json({
            totalLegacyJobs: legacyJobs?.length || 0,
            uniqueUserCoachPairs: Object.keys(migrationPreview || {}).length,
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
