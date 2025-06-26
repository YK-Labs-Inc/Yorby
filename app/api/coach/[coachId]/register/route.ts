import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { randomUUID } from "crypto";
import { AxiomRequest, withAxiom } from "next-axiom";
import { headers } from "next/headers";
import { posthog } from "@/utils/tracking/serverUtils";

export const GET = withAxiom(async (
    req: AxiomRequest,
    { params }: { params: Promise<{ coachId: string }> },
) => {
    const supabase = await createSupabaseServerClient();
    const coachId = (await params).coachId;
    let logger = req.log.with({
        coachId,
        path: "/api/coach/[coachId]/register",
    });

    let insertedJobIds: string[] = [];
    let insertedQuestionIds: string[] = [];
    let userId: string | null = null;
    let userCoachAccessCreated = false;
    const coach = await fetchCoach(coachId);
    const host = (await headers()).get("host");
    if (!host) {
        logger.error("No host found");
        throw new Error("No host found");
    }
    const errorRedirectUrl = new URL(
        `/${coach.slug}/register-error?coachId=${coach.id}`,
        req.nextUrl.origin,
    ).toString();

    try {
        // 1. Get authenticated user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
            logger.error("No user found");
            throw new Error("No user found");
        }
        userId = user.id;
        logger = logger.with({ userId });

        // 2. Insert into user_coach_access (ignore if already exists)
        const { error: accessError } = await supabase
            .from("user_coach_access")
            .upsert({ user_id: user.id, coach_id: coachId });
        if (accessError) {
            logger.error("Error inserting into user_coach_access", {
                accessError,
            });
            return NextResponse.json({
                error: "Error inserting into user_coach_access",
            }, { status: 500 });
        }
        logger.info("Inserted into user_coach_access", {
            userId,
            coachId,
        });
        userCoachAccessCreated = true;

        // 3. Fetch all custom_jobs for this coach
        const { data: jobs, error: jobsError } = await supabase
            .from("custom_jobs")
            .select("*, custom_job_questions(*)")
            .eq("user_id", coach.user_id)
            .eq("coach_id", coachId);
        if (jobsError || !jobs || jobs.length === 0) {
            logger.error("No curriculum found for this coach");
            throw new Error("No curriculum found for this coach.");
        }
        logger.info("Found programs for this coach");

        // Check PostHog feature flag
        const useNewEnrollmentSystem = await posthog.isFeatureEnabled(
            "custom-job-enrollments-migration",
            user.id,
        );
        await posthog.shutdown();

        let newJobId: string = "";

        if (useNewEnrollmentSystem) {
            // New enrollment system - enroll user directly without duplication
            logger.info("Using new enrollment system");

            // For now, just enroll in the first job (you may want to change this logic)
            const jobToEnroll = jobs[0];
            if (!jobToEnroll) {
                logger.error("No job to enroll in");
                throw new Error("No curriculum found for this coach.");
            }

            // Check if already enrolled
            const { data: existingEnrollment } = await supabase
                .from("custom_job_enrollments")
                .select("id")
                .eq("user_id", user.id)
                .eq("custom_job_id", jobToEnroll.id)
                .eq("coach_id", coachId)
                .maybeSingle();

            if (!existingEnrollment) {
                // Create enrollment
                const { error: enrollmentError } = await supabase
                    .from("custom_job_enrollments")
                    .insert({
                        user_id: user.id,
                        coach_id: coachId,
                        custom_job_id: jobToEnroll.id,
                    });

                if (enrollmentError) {
                    logger.error("Error creating enrollment", {
                        enrollmentError,
                    });
                    throw new Error("Failed to create enrollment");
                }
                logger.info("Created enrollment", {
                    userId: user.id,
                    jobId: jobToEnroll.id,
                });
            } else {
                logger.info("User already enrolled in this job");
            }

            newJobId = jobToEnroll.id;
        } else {
            // Legacy duplication system
            logger.info("Using legacy duplication system");

            // 4. Duplicate jobs and their questions
            for (const job of jobs) {
                const { data: existingJob, error: existingJobError } =
                    await supabase
                        .from("custom_jobs")
                        .select("id")
                        .eq("user_id", user.id)
                        .eq("source_custom_job_id", job.id)
                        .maybeSingle();
                if (existingJobError) {
                    logger.error("Error fetching existing job", {
                        existingJobError,
                    });
                    throw existingJobError;
                }
                if (existingJob && existingJob.id) {
                    // Already duplicated, use existing job id
                    newJobId = existingJob.id;
                } else {
                    newJobId = randomUUID();
                    insertedJobIds.push(newJobId);
                    const {
                        id,
                        coach_id,
                        user_id,
                        created_at,
                        custom_job_questions,
                        ...rest
                    } = job;
                    // Insert new job for user, set source_custom_job_id
                    await supabase.from("custom_jobs").insert({
                        ...rest,
                        id: newJobId,
                        coach_id: coachId,
                        user_id: user.id,
                        created_at: new Date().toISOString(),
                        source_custom_job_id: id,
                    });
                }
                // Duplicate questions
                const questions = job.custom_job_questions;
                if (questions && questions.length > 0) {
                    for (const q of questions) {
                        // Check if this question has already been duplicated for this job
                        const {
                            data: existingQuestion,
                        } = await supabase
                            .from("custom_job_questions")
                            .select("id")
                            .eq("custom_job_id", newJobId)
                            .eq("source_custom_job_question_id", q.id)
                            .maybeSingle();
                        if (existingQuestion && existingQuestion.id) {
                            continue;
                        }
                        const { id: qid, custom_job_id, created_at, ...qrest } =
                            q;
                        const newQId = randomUUID();
                        insertedQuestionIds.push(newQId);
                        await supabase.from("custom_job_questions").insert({
                            ...qrest,
                            id: newQId,
                            custom_job_id: newJobId,
                            created_at: new Date().toISOString(),
                            source_custom_job_question_id: qid,
                        });
                    }
                }
            }
        }

        // 6. Check if user has a display name
        const needsOnboarding = !user.user_metadata?.display_name;

        // Build the final coach program URL
        const coachProgramUrl = `/${coach.slug}/programs/${newJobId}`;
        const protocol = host.includes("localhost") ? "http" : "https";

        let redirectUrl: string;
        if (needsOnboarding) {
            // Redirect to onboarding with the final destination as a parameter
            redirectUrl = `${protocol}://${host}/coaches/onboarding?redirect=${
                encodeURIComponent(coachProgramUrl)
            }`;
        } else {
            // Redirect directly to the first curriculum page
            redirectUrl = `${protocol}://${host}${coachProgramUrl}`;
        }

        return NextResponse.redirect(redirectUrl);
    } catch (err) {
        logger.error("Error during registration, rolling back", { err });
        // Rollback: delete inserted custom_job_questions, custom_jobs, and user_coach_access
        if (insertedQuestionIds.length > 0) {
            await supabase.from("custom_job_questions").delete().in(
                "id",
                insertedQuestionIds,
            );
        }
        if (insertedJobIds.length > 0) {
            await supabase.from("custom_jobs").delete().in(
                "id",
                insertedJobIds,
            );
        }
        if (userCoachAccessCreated && userId) {
            await supabase.from("user_coach_access").delete().eq(
                "user_id",
                userId,
            ).eq("coach_id", coachId);
        }
        return NextResponse.redirect(errorRedirectUrl);
    }
});

const fetchCoach = async (coachId: string) => {
    const supabase = await createSupabaseServerClient();
    // Fetch coach details first to be used for any redirect.
    const { data: coach, error: coachFetchError } = await supabase
        .from("coaches")
        .select("id, slug, user_id")
        .eq("id", coachId)
        .single();

    if (coachFetchError || !coach) {
        throw new Error("Coach not found.");
    }
    return coach;
};
