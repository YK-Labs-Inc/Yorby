import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { headers } from "next/headers";

export const GET = withAxiom(async (
    req: AxiomRequest,
    { params }: { params: Promise<{ coachId: string; programId: string }> },
) => {
    const supabase = await createSupabaseServerClient();
    const { coachId, programId } = await params;
    
    let logger = req.log.with({
        coachId,
        programId,
        path: "/api/coach/[coachId]/register/[programId]",
    });

    let userId: string | null = null;
    let userCoachAccessCreated = false;
    const coach = await fetchCoach(coachId);
    const host = (await headers()).get("host");
    if (!host) {
        logger.error("No host found");
        throw new Error("No host found");
    }
    const errorRedirectUrl = new URL(
        `/${coach.slug}/register-error?coachId=${coach.id}&programId=${programId}`,
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

        // 3. Fetch the specific program
        const { data: program, error: programError } = await supabase
            .from("custom_jobs")
            .select("*")
            .eq("id", programId)
            .eq("user_id", coach.user_id)
            .eq("coach_id", coachId)
            .single();
        if (programError || !program) {
            logger.error("Program not found", { programId, programError });
            throw new Error("Program not found.");
        }
        logger.info("Found program", { programId });

        // Check if already enrolled
        const { data: existingEnrollment } = await supabase
            .from("custom_job_enrollments")
            .select("id")
            .eq("user_id", user.id)
            .eq("custom_job_id", programId)
            .eq("coach_id", coachId)
            .maybeSingle();

        if (!existingEnrollment) {
            // Create enrollment
            const { error: enrollmentError } = await supabase
                .from("custom_job_enrollments")
                .insert({
                    user_id: user.id,
                    coach_id: coachId,
                    custom_job_id: programId,
                });

            if (enrollmentError) {
                logger.error("Error creating enrollment", {
                    enrollmentError,
                });
                throw new Error("Failed to create enrollment");
            }
            logger.info("Created enrollment", {
                userId: user.id,
                programId,
            });
        } else {
            logger.info("User already enrolled in this program");
        }

        // 6. Check if user has a display name
        const needsOnboarding = !user.user_metadata?.display_name;

        // Build the final coach program URL
        const coachProgramUrl = `/${coach.slug}/programs/${programId}`;
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
        // Rollback: delete user_coach_access if created
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
