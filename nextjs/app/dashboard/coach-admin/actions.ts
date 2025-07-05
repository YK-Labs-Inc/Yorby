"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";

export async function getCoachId(userId: string) {
    const logger = new Logger().with({ function: "getCoachId", userId });
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", userId)
        .single();

    if (error || !data) {
        logger.error("Error fetching coach ID:", error);
        await logger.flush();
        return null;
    }

    await logger.flush();

    return data.id;
}

export async function getCurrentUserCoachId() {
    const logger = new Logger().with({ function: "getCurrentUserCoachId" });
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        logger.error("Error fetching authenticated user:", { error: authError });
        await logger.flush();
        return null;
    }

    const { data, error } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (error || !data) {
        logger.error("Error fetching coach ID:", error);
        await logger.flush();
        return null;
    }

    await logger.flush();

    return data.id;
}

export async function getStudentPrograms(studentId: string, coachId: string) {
  const logger = new Logger().with({ function: "getStudentPrograms", studentId, coachId });
  try {
    const supabase = await createSupabaseServerClient();
    
    // Fetch enrolled programs for the student
    const { data: enrollments, error } = await supabase
      .from("custom_job_enrollments")
      .select(
        `
        custom_jobs!inner(
          id,
          job_title,
          created_at
        )
      `
      )
      .eq("user_id", studentId)
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });
    
    if (error) {
      logger.error("Error fetching enrollments", { error });
      await logger.flush();
      throw new Error("Failed to fetch enrollments");
    }
    
    // Transform the data
    const programs = enrollments.map((enrollment) => ({
      id: enrollment.custom_jobs.id,
      job_title: enrollment.custom_jobs.job_title,
      created_at: enrollment.custom_jobs.created_at,
    }));
    
    // Fetch counts for each program
    const programIds = programs.map((p) => p.id);
    
    // Get question counts
    const { data: questionCounts } = await supabase
      .from("custom_job_questions")
      .select("custom_job_id")
      .in("custom_job_id", programIds);
    
    // Get mock interview counts
    const { data: mockInterviewCounts } = await supabase
      .from("custom_job_mock_interviews")
      .select("custom_job_id")
      .eq("status", "complete")
      .eq("user_id", studentId)
      .in("custom_job_id", programIds);
    
    // Add counts to programs
    const programsWithCounts = programs.map((program) => ({
      ...program,
      questionsCount:
        questionCounts?.filter((q) => q.custom_job_id === program.id).length ||
        0,
      mockInterviewsCount:
        mockInterviewCounts?.filter((m) => m.custom_job_id === program.id)
          .length || 0,
    }));
    
    logger.info("Successfully fetched student programs", { programCount: programsWithCounts.length });
    await logger.flush();
    return { programs: programsWithCounts };
  } catch (error) {
    logger.error("Error in getStudentPrograms", { error });
    await logger.flush();
    throw error;
  }
}

export async function getProgramQuestions(programId: string, studentId: string) {
  const logger = new Logger().with({ function: "getProgramQuestions", programId, studentId });
  try {
    const supabase = await createSupabaseServerClient();
    
    // Fetch questions for this program
    const { data: questions, error } = await supabase
      .from("custom_job_questions")
      .select("*")
      .eq("custom_job_id", programId)
      .order("created_at", { ascending: true });
    
    if (error) {
      logger.error("Error fetching questions", { error });
      await logger.flush();
      throw new Error("Failed to fetch questions");
    }
    
    if (!questions || questions.length === 0) {
      return { questions: [] };
    }
    
    // Fetch submissions for these questions
    const questionIds = questions.map((q) => q.id);
    const { data: submissions, error: submissionsError } = await supabase
      .from("custom_job_question_submissions")
      .select(
        `
        *,
        custom_job_question_submission_feedback (
          id,
          feedback_role
        )
      `
      )
      .in("custom_job_question_id", questionIds)
      .eq("user_id", studentId)
      .order("created_at", { ascending: false });
    
    if (submissionsError) {
      logger.error("Error fetching submissions", { error: submissionsError });
    }
    
    // Group submissions by question
    const submissionsByQuestion: Record<string, any[]> = {};
    submissions?.forEach((submission) => {
      const questionId = submission.custom_job_question_id;
      if (!submissionsByQuestion[questionId]) {
        submissionsByQuestion[questionId] = [];
      }
      
      const hasCoachFeedback = submission.custom_job_question_submission_feedback
        ?.some((fb: any) => fb.feedback_role === "user");
      
      submissionsByQuestion[questionId].push({
        ...submission,
        hasCoachFeedback,
      });
    });
    
    // Enhance questions with submission info
    const questionsWithSubmissions = questions.map((question) => {
      const questionSubmissions = submissionsByQuestion[question.id] || [];
      const latestSubmission = questionSubmissions[0];
      
      return {
        ...question,
        submissions: questionSubmissions,
        latestSubmission,
        hasSubmission: questionSubmissions.length > 0,
        hasCoachFeedback: latestSubmission?.hasCoachFeedback || false,
      };
    });
    
    logger.info("Successfully fetched program questions", { questionCount: questionsWithSubmissions.length });
    await logger.flush();
    return { questions: questionsWithSubmissions };
  } catch (error) {
    logger.error("Error in getProgramQuestions", { error });
    await logger.flush();
    throw error;
  }
}

export async function getProgramMockInterviews(programId: string, studentId: string) {
  const logger = new Logger().with({ function: "getProgramMockInterviews", programId, studentId });
  try {
    const supabase = await createSupabaseServerClient();
    
    // Fetch mock interviews for this program and student
    const { data: mockInterviews, error } = await supabase
      .from("custom_job_mock_interviews")
      .select("*")
      .eq("custom_job_id", programId)
      .eq("user_id", studentId)
      .eq("status", "complete")
      .order("created_at", { ascending: false });
    
    if (error) {
      logger.error("Error fetching mock interviews", { error });
      await logger.flush();
      throw new Error("Failed to fetch mock interviews");
    }
    
    logger.info("Successfully fetched mock interviews", { count: mockInterviews?.length || 0 });
    await logger.flush();
    return { mockInterviews: mockInterviews || [] };
  } catch (error) {
    logger.error("Error in getProgramMockInterviews", { error });
    await logger.flush();
    throw error;
  }
}

export async function getQuestionSubmissions(questionId: string, studentId: string) {
  const logger = new Logger().with({ function: "getQuestionSubmissions", questionId, studentId });
  try {
    const supabase = await createSupabaseServerClient();
    
    // Fetch the question details
    const { data: question, error: questionError } = await supabase
      .from("custom_job_questions")
      .select("*")
      .eq("id", questionId)
      .single();
    
    if (questionError) {
      logger.error("Error fetching question", { error: questionError });
      await logger.flush();
      throw new Error("Failed to fetch question");
    }
    
    // Fetch all submissions for this question by this student
    const { data: submissions, error: submissionsError } = await supabase
      .from("custom_job_question_submissions")
      .select(
        `
        *,
        custom_job_question_submission_feedback(*),
        mux_metadata:custom_job_question_submission_mux_metadata(*)
      `
      )
      .eq("custom_job_question_id", questionId)
      .eq("user_id", studentId)
      .order("created_at", { ascending: false });
    
    if (submissionsError) {
      logger.error("Error fetching submissions", { error: submissionsError });
      await logger.flush();
      throw new Error("Failed to fetch submissions");
    }
    
    // Process submissions to add coach feedback status
    const processedSubmissions = submissions.map((submission) => {
      const coachFeedback = submission.custom_job_question_submission_feedback
        ?.find((fb: any) => fb.feedback_role === "user");
      
      return {
        ...submission,
        coachFeedback,
        hasCoachFeedback: !!coachFeedback,
      };
    });
    
    logger.info("Successfully fetched question submissions", { submissionCount: processedSubmissions.length });
    await logger.flush();
    return {
      question,
      submissions: processedSubmissions,
    };
  } catch (error) {
    logger.error("Error in getQuestionSubmissions", { error });
    await logger.flush();
    throw error;
  }
}

export async function getMockInterviewDetails(interviewId: string) {
  const logger = new Logger().with({ function: "getMockInterviewDetails", interviewId });
  try {
    const supabase = await createSupabaseServerClient();
    
    // Fetch the mock interview details
    const { data: mockInterview, error } = await supabase
      .from("custom_job_mock_interviews")
      .select(
        `
        *,
        mock_interview_messages(*),
        custom_job_mock_interview_feedback(*),
        mock_interview_question_feedback(*)
      `
      )
      .eq("id", interviewId)
      .single();
    
    if (error) {
      logger.error("Error fetching mock interview", { error });
      await logger.flush();
      throw new Error("Failed to fetch mock interview");
    }
    
    if (!mockInterview) {
      logger.error("Mock interview not found", { interviewId });
      await logger.flush();
      throw new Error("Mock interview not found");
    }
    
    logger.info("Successfully fetched mock interview details");
    await logger.flush();
    return { mockInterview };
  } catch (error) {
    logger.error("Error in getMockInterviewDetails", { error });
    await logger.flush();
    throw error;
  }
}
