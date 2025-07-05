"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { Resend } from "resend";
import { StudentCoachFeedbackNotification } from "@/components/email/StudentCoachFeedbackNotification";
import { createAdminClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

async function sendStudentCoachFeedbackNotification({
    submissionId,
    pros,
    cons,
}: {
    submissionId: string;
    pros: string[];
    cons: string[];
}) {
    const logger = new Logger().with({
        function: "sendStudentCoachFeedbackNotification",
        submissionId,
    });
    try {
        const adminClient = await createAdminClient();
        // 1. Get the submission row
        const { data: submission } = await adminClient
            .from("custom_job_question_submissions")
            .select("id, custom_job_question_id")
            .eq("id", submissionId)
            .single();
        if (!submission) throw new Error("Submission not found");
        // 2. Get the question row
        const { data: question } = await adminClient
            .from("custom_job_questions")
            .select("id, question, custom_job_id")
            .eq("id", submission.custom_job_question_id)
            .single();
        if (!question) throw new Error("Question not found");
        // 3. Get the job row
        const { data: job } = await adminClient
            .from("custom_jobs")
            .select("id, job_title, user_id, coach_id")
            .eq("id", question.custom_job_id)
            .single();
        if (!job) throw new Error("Job not found");
        if (!job.coach_id) throw new Error("Coach ID not found on job");
        // 4. Get the student user (for email and full name)
        const { data: studentUser } = await adminClient.auth.admin.getUserById(
            job.user_id,
        );
        const studentEmail = studentUser?.user?.email;
        const studentFullName = studentUser?.user?.user_metadata?.full_name ||
            studentEmail || "Student";
        if (!studentEmail) throw new Error("Student email not found");
        // 5. Get the coach info (for name and slug)
        const { data: coach } = await adminClient
            .from("coaches")
            .select("name, slug")
            .eq("id", job.coach_id)
            .single();
        if (!coach) throw new Error("Coach not found");
        // 6. Build the review link (student-facing)
        const baseUrl = (await headers()).get("origin");
        const coachSlug = coach.slug;
        const reviewLink =
            `${baseUrl}/${coachSlug}/programs/${job.id}/questions/${question.id}?submissionId=${submissionId}`;
        // 7. Send the email
        const resend = new Resend(process.env.RESEND_API_KEY!);
        await resend.emails.send({
            from: "Yorby <notifications@noreply.yorby.ai>",
            to: [studentEmail],
            subject: `Your coach left feedback on one of your answers`,
            react: StudentCoachFeedbackNotification({
                coachName: coach.name,
                jobTitle: job.job_title,
                questionText: question.question,
                pros,
                cons,
                reviewLink,
            }),
        });
        logger.info("Sent coach feedback email to student", {
            studentEmail,
            studentFullName,
            reviewLink,
        });
    } catch (emailError) {
        logger.error("Failed to send coach feedback email", {
            error: emailError,
        });
    }
}

export async function createCoachFeedback(formData: FormData) {
    const submissionId = formData.get("submissionId") as string;
    const pros = JSON.parse(formData.get("pros") as string) as string[];
    const cons = JSON.parse(formData.get("cons") as string) as string[];
    const hasPros = Array.isArray(pros) &&
        pros.some((p) => p.trim().length > 0);
    const hasCons = Array.isArray(cons) &&
        cons.some((c) => c.trim().length > 0);
    if (!hasPros && !hasCons) {
        return {
            error:
                "Please provide at least one strength or one area for improvement.",
        };
    }
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("errors");
    const logger = new Logger().with({
        function: "createCoachFeedback",
        submissionId,
        pros,
        cons,
    });
    try {
        // Get the current user and verify they are a coach
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            logger.error("Not authenticated");
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        const { data: coach } = await supabase
            .from("coaches")
            .select("id, name, slug")
            .eq("user_id", user.id)
            .single();
        if (!coach) {
            logger.error("Not authorized as a coach");
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        // Create the feedback
        const { error } = await supabase
            .from("custom_job_question_submission_feedback")
            .insert({
                submission_id: submissionId,
                feedback_role: "user",
                pros: pros,
                cons: cons,
            });
        if (error) {
            logger.error("Failed to create feedback", { error });
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        // Send email notification in the background (do not block feedback creation)
        try {
            sendStudentCoachFeedbackNotification({ submissionId, pros, cons });
        } catch (err) {
            logger.error("Error sending coach feedback notification", {
                error: err,
            });
        }
        logger.info("Successfully created coach feedback");
        await logger.flush();
        revalidatePath("/dashboard/coach-admin/students");
        return { success: true };
    } catch (error) {
        logger.error("Error in createCoachFeedback", { error });
        await logger.flush();
        return { error: t("pleaseTryAgain") };
    }
}

export async function updateCoachFeedback(formData: FormData) {
    const feedbackId = formData.get("feedbackId") as string;
    const pros = JSON.parse(formData.get("pros") as string) as string[];
    const cons = JSON.parse(formData.get("cons") as string) as string[];
    const hasPros = Array.isArray(pros) &&
        pros.some((p) => p.trim().length > 0);
    const hasCons = Array.isArray(cons) &&
        cons.some((c) => c.trim().length > 0);
    if (!hasPros && !hasCons) {
        return {
            error:
                "Please provide at least one strength or one area for improvement.",
        };
    }
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("errors");
    const logger = new Logger().with({
        function: "updateCoachFeedback",
        feedbackId,
        pros,
        cons,
    });
    try {
        // Verify coach access
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            logger.error("Not authenticated");
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        const { data: coach } = await supabase
            .from("coaches")
            .select("id")
            .eq("user_id", user.id)
            .single();
        if (!coach) {
            logger.error("Not authorized as a coach");
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        // Update the feedback
        const { error } = await supabase
            .from("custom_job_question_submission_feedback")
            .update({
                pros: pros,
                cons: cons,
            })
            .eq("id", feedbackId)
            .eq("feedback_role", "user");
        if (error) {
            logger.error("Failed to update feedback", { error });
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        logger.info("Successfully updated coach feedback");
        await logger.flush();
        revalidatePath("/dashboard/coach-admin/students");
        return { success: true };
    } catch (error) {
        logger.error("Error in updateCoachFeedback", { error });
        await logger.flush();
        return { error: t("pleaseTryAgain") };
    }
}

export async function deleteCoachFeedback(formData: FormData) {
    const feedbackId = formData.get("feedbackId") as string;
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("errors");
    const logger = new Logger().with({
        function: "deleteCoachFeedback",
        feedbackId,
    });
    try {
        // Verify coach access
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            logger.error("Not authenticated");
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        const { data: coach } = await supabase
            .from("coaches")
            .select("id")
            .eq("user_id", user.id)
            .single();
        if (!coach) {
            logger.error("Not authorized as a coach");
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        // Delete the feedback
        const { error } = await supabase
            .from("custom_job_question_submission_feedback")
            .delete()
            .eq("id", feedbackId)
            .eq("feedback_role", "user");
        if (error) {
            logger.error("Failed to delete feedback", { error });
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        logger.info("Successfully deleted coach feedback");
        await logger.flush();
        revalidatePath("/dashboard/coach-admin/students");
        return { success: true };
    } catch (error) {
        logger.error("Error in deleteCoachFeedback", { error });
        await logger.flush();
        return { error: t("pleaseTryAgain") };
    }
}
