import { AxiomRequest, Logger, withAxiom } from "next-axiom";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { CoreMessage } from "ai";
import { getAllUserMemories } from "../utils";
import { z } from "zod";

export const POST = withAxiom(async (req: AxiomRequest) => {
  let logger = new Logger().with({
    route: "api/memories/update",
  });
  const { messages } = (await req.json()) as {
    messages: CoreMessage[];
  };
  const supabase = await createSupabaseServerClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  logger = logger.with({
    userId: user.id,
  });

  // Fetch user files using getAllUserMemories
  const { files: userFiles } = await getAllUserMemories(user.id);

  logger = logger.with({
    userFiles: userFiles.length,
  });

  // Get existing knowledge base or create new one
  const { data: existingKnowledgeBase } = await supabase
    .from("user_knowledge_base")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentKnowledgeBase = existingKnowledgeBase?.knowledge_base || "";

  logger = logger.with({
    currentKnowledgeBase: currentKnowledgeBase.length,
  });

  // Use LLM to update knowledge base
  const updatedMessages: CoreMessage[] = [
    {
      role: "user",
      content: [
        {
          type: "text" as const,
          text: `Generate a knowledge base update based on the conversation history and the list of files. 

          ## Current knowledge base
          ${currentKnowledgeBase}

          ## New information
          ${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}  
        `,
        },
        ...userFiles.map((file) => ({
          type: "file" as const,
          data: file.fileData.fileUri,
          mimeType: file.fileData.mimeType,
        })),
      ],
    },
  ];

  try {
    const { updatedKnowledgeBase, didUpdateKnowledgeBase } =
      await generateObjectWithFallback({
        systemPrompt: `You are an assistant whose role is to create a career knowledge base for a user.

        The career knowledge base of a user is a collection of information abouthe user's past and current
        work experiences, education, skills, and other relevant information. It should not include information
        about jobs that they are applying to or jobs they are interviewing for.


    You will be provided with the conversation history between a user and another assistant, and 
    it is your duty to analyze the conversation history and update the user's career knowledge base accordingly.

    You might also be provided with a list of files that the user has uploaded. Analyze the contents of the file
    and use it to update the knowledge base.

    Update the knowledge base by:
    1. Extracting any career-relevant information that is about the user's personal history or personal preferences.
    If the information you discover is not about the user's personal/career history or personal/career preferences,
    do not include it in the knowledge base.
    2. Integrating it with existing information
    3. Maintaining a clear, organized structure
    4. Removing any redundant information
    5. DO NOT include information about target roles or specific jobs they are applying to. This is not relevant to the user's 
    career knowledge base.

    Return ONLY the updated knowledge base text. Your response should be in markdown format.
    Your response will also be fed into other LLMs as additional context about the user, so make
    sure the markdown formatting is optimized for LLM consumption.

    Do not wrap your response in \`\`\`markdown tags. Just return the markdown text.

    Return an object with the following properties:
    {
      updatedKnowledgeBase: string // The updated knowledge base text.
      didUpdateKnowledgeBase: boolean // Whether the knowledge base was updated with new information.
    }
    `,
        messages: updatedMessages,
        loggingContext: {
          operation: "update_knowledge_base",
          userId: user.id,
        },
        modelConfig: {
          primaryModel: "gemini-2.5-pro-preview-03-25",
          fallbackModel: "gemini-2.5-flash-preview-04-17",
        },
        schema: z.object({
          updatedKnowledgeBase: z.string(),
          didUpdateKnowledgeBase: z.boolean(),
        }),
      });

    logger = logger.with({
      updatedKnowledgeBase,
      didUpdateKnowledgeBase,
    });

    // Create or update knowledge base entry
    await supabase.from("user_knowledge_base").upsert(
      {
        user_id: user.id,
        knowledge_base: updatedKnowledgeBase,
      },
      {
        onConflict: "user_id",
      }
    );

    logger.info("Knowledge base updated");

    return new Response(
      JSON.stringify({
        success: true,
        updatedKnowledgeBase,
        didUpdateKnowledgeBase,
      }),
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    logger.error("Error updating knowledge base:", {
      error: error instanceof Error ? error.message : error,
    });
    return new Response(
      JSON.stringify({ error: "Failed to update knowledge base" }),
      {
        status: 500,
      }
    );
  }
});
