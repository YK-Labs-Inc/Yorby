import { AxiomRequest, Logger, withAxiom } from "next-axiom";
import { serve } from "@upstash/workflow/nextjs";
import { createAdminClient } from "@/utils/supabase/server";
import { processInterviews } from "./candidateInterviewAnalysis";
import { generateAggregatedAnalysis } from "./aggregatedInterviewAnalysis";

export const POST = withAxiom(
  async (
    request: AxiomRequest,
    context: { params: Promise<{ candidateId: string }> }
  ) => {
    const { candidateId } = await context.params;
    const { POST: handler } = serve(async (context) => {
      const candidateInterviewIds = await context.run(
        "fetch-candidate-interviews",
        () => {
          return fetchCandidateInterviews(candidateId);
        }
      );

      await context.run("process-each-interview", () => {
        return processInterviews(candidateInterviewIds);
      });

      await context.run("generate-aggregated-analysis", () => {
        return generateAggregatedAnalysis(candidateId);
      });
    });
    return await handler(request);
  }
);

const fetchCandidateInterviews = async (candidateId: string) => {
  const supabase = await createAdminClient();
  const logger = new Logger().with({
    function: "fetchCandidateInterviews",
    candidateId,
  });
  const { data: interviews, error: interviewsError } = await supabase
    .from("candidate_job_interviews")
    .select("id")
    .eq("candidate_id", candidateId);

  if (interviewsError || !interviews || interviews.length === 0) {
    logger.error("Failed to fetch candidate interviews", {
      candidateId,
      error: interviewsError,
    });
    await logger.flush();
    throw new Error("Failed to fetch candidate interviews");
  }

  return interviews.map((i) => i.id);
};
