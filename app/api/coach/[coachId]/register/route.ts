import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { randomUUID } from "crypto";
import { AxiomRequest, withAxiom } from "next-axiom";

const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `https://${process.env.NEXT_PUBLIC_SITE_URL}`
    : "http://localhost:3000";

export const GET = withAxiom(async (
    req: AxiomRequest,
    { params }: { params: Promise<{ coachId: string }> },
) => {
    const supabase = await createSupabaseServerClient();
    const coachId = (await params).coachId;
    let logger = req.log.with({ coachId });

    let insertedJobIds: string[] = [];
    let insertedQuestionIds: string[] = [];
    let userId: string | null = null;
    let userCoachAccessCreated = false;
    const coach = await fetchCoach(coachId);
    const errorRedirectUrl = new URL(
        `/coaches/${coach.slug}/register-error?coachId=${coach.id}`,
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
        userCoachAccessCreated = true;

        // 3. Fetch all custom_jobs for this coach
        const { data: jobs, error: jobsError } = await supabase
            .from("custom_jobs")
            .select("*, custom_job_questions(*)")
            .eq("coach_id", coachId);
        if (jobsError || !jobs || jobs.length === 0) {
            logger.error("No curriculum found for this coach");
            throw new Error("No curriculum found for this coach.");
        }

        // 4. Duplicate jobs and their questions
        let firstNewJobId = null;
        for (const job of jobs) {
            const newJobId = randomUUID();
            if (!firstNewJobId) firstNewJobId = newJobId;
            insertedJobIds.push(newJobId);
            const {
                id,
                coach_id,
                user_id,
                created_at,
                custom_job_questions,
                ...rest
            } = job;
            // Insert new job for user
            await supabase.from("custom_jobs").insert({
                ...rest,
                id: newJobId,
                coach_id: coachId,
                user_id: user.id,
                created_at: new Date().toISOString(),
            });
            // Duplicate questions
            const questions = job.custom_job_questions;
            if (questions && questions.length > 0) {
                for (const q of questions) {
                    const { id: qid, custom_job_id, created_at, ...qrest } = q;
                    const newQId = randomUUID();
                    insertedQuestionIds.push(newQId);
                    await supabase.from("custom_job_questions").insert({
                        ...qrest,
                        id: newQId,
                        custom_job_id: newJobId,
                        created_at: new Date().toISOString(),
                    });
                }
            }
        }

        // 6. Redirect to the first curriculum page
        const redirectUrl =
            `${defaultUrl}/coaches/${coach.slug}/curriculum/${firstNewJobId}`;
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
        .select("id, slug")
        .eq("id", coachId)
        .single();

    if (coachFetchError || !coach) {
        throw new Error("Coach not found.");
    }
    return coach;
};
