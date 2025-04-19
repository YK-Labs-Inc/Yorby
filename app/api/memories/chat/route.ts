import { AxiomRequest, withAxiom } from "next-axiom";
import {
  streamTextResponseWithFallback,
  uploadFileToGemini,
} from "@/utils/ai/gemini";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { CoreMessage } from "ai";

export const POST = withAxiom(async (req: AxiomRequest) => {
  const formData = await req.formData();
  const conversationId = formData.get("conversationId") as string;
  const files = formData.getAll("files") as File[];
  const messages = JSON.parse(
    formData.get("messages") as string
  ) as CoreMessage[];
  const logger = req.log.with({
    conversationId,
    files,
    messages,
  });

  const supabase = await createSupabaseServerClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id || "anonymous";

  // If no conversationId is provided, create a new conversation
  let currentConversationId = conversationId;
  if (!currentConversationId) {
    const { data: conversationData, error: conversationError } = await supabase
      .from("user_knowledge_base_conversations")
      .insert({ user_id: userId })
      .select("id")
      .single();

    if (conversationError) {
      return new Response(
        JSON.stringify({ error: conversationError.message }),
        { status: 500 }
      );
    }

    currentConversationId = conversationData.id;
  }

  // Handle file uploads if any
  const uploadedFileIds: string[] = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const fileId = uuidv4();
      const fileBuffer = await file.arrayBuffer();

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(`${userId}/${fileId}`, fileBuffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        return new Response(JSON.stringify({ error: uploadError.message }), {
          status: 500,
        });
      }

      // Upload to Gemini
      const blob = new Blob([fileBuffer], { type: "application/pdf" });
      const uploadResponse = await uploadFileToGemini({
        blob,
        displayName: file.name,
      });

      // Create entry in user_files table
      const { error: fileError } = await supabase.from("user_files").insert({
        id: fileId,
        user_id: userId,
        display_name: file.name,
        file_path: `${userId}/${fileId}`,
        bucket_name: "user-files",
        mime_type: file.type,
        google_file_name: uploadResponse.file.name,
        google_file_uri: uploadResponse.file.uri,
        added_to_memory: true,
      });

      if (fileError) {
        return new Response(JSON.stringify({ error: fileError.message }), {
          status: 500,
        });
      }

      uploadedFileIds.push(fileId);
    }
  }

  // Create a new message with file references
  const { error: messageError } = await supabase
    .from("user_knowledge_base_messages")
    .insert({
      conversation_id: currentConversationId,
      message: messages[messages.length - 1].content as string,
      role: "user",
    });

  if (messageError) {
    throw messageError;
  }

  const systemPrompt = `An assistant whose role is to gather information about a user's career and work history.
    
    As the user provides information, ask follow up questions to gather more information about whatever
    the user has provided. If the user has provided enough information, thank them and ask if they have
    any other information they would like to add.

    Your tone should be friendly and professional and youre response should be concise and to the point.
    `;

  try {
    const result = await streamTextResponseWithFallback({
      messages,
      systemPrompt,
      loggingContext: {
        conversationId: currentConversationId,
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result) {
            const encoded = new TextEncoder().encode(chunk);
            controller.enqueue(encoded);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=utf-8");
    headers.set("X-Conversation-Id", currentConversationId);
    logger.info("Successfully chatted with knowledge base");
    return new Response(stream, { headers });
  } catch (error) {
    logger.error("Error chatting with knowledge base", { error });
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
      }
    );
  }
});

// Add a DELETE endpoint to handle conversation deletion
export const DELETE = withAxiom(async (req: AxiomRequest) => {
  const data = (await req.json()) as {
    conversationId: string;
  };
  const { conversationId } = data;

  const supabase = await createSupabaseServerClient();

  // Delete the conversation and its associated messages
  const { error: deleteError } = await supabase
    .from("user_knowledge_base_conversations")
    .delete()
    .eq("id", conversationId);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
