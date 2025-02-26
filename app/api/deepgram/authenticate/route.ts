import { DeepgramError, createClient } from "@deepgram/sdk";
import { NextResponse } from "next/server";
import { withAxiom, AxiomRequest } from "next-axiom";

export const revalidate = 0;

// Helper function to create a timeout promise
const createTimeout = (ms: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms} milliseconds`));
    }, ms);
  });
};

// Helper function to create a project key with timeout and retry logic
const createProjectKeyWithRetry = async (
  deepgram: any,
  projectId: string,
  options: any,
  logger: any,
  maxRetries = 3,
  timeoutMs = 4000
) => {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    try {
      // Use Promise.race to implement timeout
      const result = await Promise.race([
        deepgram.manage.createProjectKey(projectId, options),
        createTimeout(timeoutMs),
      ]);
      return result;
    } catch (error: unknown) {
      lastError = error as Error;
      retries++;
      logger.warn(`Attempt ${retries} failed to create project key`, { error });

      // Only log timeout errors specifically
      if (error instanceof Error && error.message.includes("timed out")) {
        logger.warn(
          `Request timed out after ${timeoutMs}ms, retrying... (${retries}/${maxRetries})`
        );
      }

      // If we've reached max retries, break out of loop
      if (retries >= maxRetries) break;
    }
  }

  // If we've exhausted all retries, throw the last error
  throw new Error(
    `Failed to create project key after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`
  );
};

export const GET = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    path: "/api/deepgram/authenticate",
  });
  try {
    // gotta use the request object to invalidate the cache every request
    const url = request.url;
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY ?? "");

    let { result: projectsResult, error: projectsError } =
      await deepgram.manage.getProjects();

    if (projectsError) {
      logger.error("Error getting projects", { error: projectsError });
      return NextResponse.json(projectsError);
    }

    const project = projectsResult?.projects[0];

    if (!project) {
      logger.error(
        "Cannot find a Deepgram project. Please create a project first."
      );
      return NextResponse.json(
        new DeepgramError(
          "Cannot find a Deepgram project. Please create a project first."
        )
      );
    }

    try {
      // Use the retry function instead of calling the API directly
      const { result: newKeyResult, error: newKeyError } =
        await createProjectKeyWithRetry(
          deepgram,
          project.project_id,
          {
            comment: "Temporary API key",
            scopes: ["usage:write"],
            tags: ["next.js"],
            time_to_live_in_seconds: 60,
          },
          logger
        );

      if (newKeyError) {
        logger.error("Error creating new key", { error: newKeyError });
        return NextResponse.json(newKeyError);
      }

      const response = NextResponse.json({ ...newKeyResult, url });
      response.headers.set("Surrogate-Control", "no-store");
      response.headers.set(
        "Cache-Control",
        "s-maxage=0, no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      response.headers.set("Expires", "0");

      return response;
    } catch (error: unknown) {
      logger.error("Error creating project key with retries", { error });
      return NextResponse.json(
        new DeepgramError(
          `Failed to create project key: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      );
    }
  } catch (error) {
    logger.error("Error authenticating Deepgram", { error });
    return NextResponse.json(error);
  }
});
