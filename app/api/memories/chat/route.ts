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
  const isOnboarding = formData.get("isOnboarding") === "true";
  const logger = req.log.with({
    conversationId,
    files,
    messages,
    isOnboarding,
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

    ${
      isOnboarding
        ? `Your goal is to obtain the following information from the user in the order provided:
    - Name
    - Email
    - Phone
    - Location
    - Education
    - Work Experience
    - Skills

    If the user tries to provide information outside of these categories, politely ask them to stick to the categories provided.

    As you chat back and forth with the user, ask questions to gather the information you need.

    Ask for each piece of information one at a time.

    I will now provide you with more specific instructions for certain pieces of information.

    ## Education
    - Ask for the school, degree, graduation year, and GPA
    - At the end, ask for any additional information about the education. If they respond and indicate that they have no more 
    information to provide about their education, then you can move onto the work experience section.

    ## Work Experience
    - Ask for the company, title, start date, end date, and what they did at the company
    - For each company that they work for, ask them about their responsibilities and accomplishments. This information will be used to generate a list of bullet points for the resume.
    We will try to generate 3-5 bullet points for each company, so ask for as much information as possible about their responsibilities and accomplishments. If they 
    do not have any additional information about a company, then move onto the next company.
    - At the end, ask for any additional information about the work experience. If they do not have any additional work experience, move onto the skills section.
    
    ## Skills
    - Ask for the skills that they are most proficient in and have experience with
    - At the end, ask for any additional information about the skills. If they do not have any additional skills, then you can move onto completing the interview.`
        : ""
    }
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
