import { AxiomRequest, withAxiom } from "next-axiom";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { generateTextWithFallback } from "@/utils/ai/gemini";
import { CoreMessage } from "ai";
import { getAllUserMemories } from "../utils";

export const POST = withAxiom(async (req: AxiomRequest) => {
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

  // Fetch user files using getAllUserMemories
  const { files: userFiles } = await getAllUserMemories(user.id);

  // Get existing knowledge base or create new one
  const { data: existingKnowledgeBase } = await supabase
    .from("user_knowledge_base")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentKnowledgeBase = existingKnowledgeBase?.knowledge_base || "";

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
    const updatedKnowledgeBase = await generateTextWithFallback({
      systemPrompt: `You are an assistant whose role is to be a career knowledge base for a user.
    You will be provided with the conversation history between a user and another assistant, and 
    it is your duty to analyze the conversation history and update the user's career knowledge base accordingly.

    You might also be provided with a list of files that the user has uploaded. Analyze the contents of the file
    and use it to update the knowledge base.

    Update the knowledge base by:
    1. Extracting any career-relevant information
    2. Integrating it with existing information
    3. Maintaining a clear, organized structure
    4. Removing any redundant information

    Return ONLY the updated knowledge base text. Your response should be in markdown format.
    Your response will also be fed into other LLMs as additional context about the user, so make
    sure the markdown formatting is optimized for LLM consumption.
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

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating knowledge base:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update knowledge base" }),
      {
        status: 500,
      }
    );
  }
});
