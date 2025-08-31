import { AxiomRequest, Logger, withAxiom } from "next-axiom";
import {
  generateObjectWithFallback,
  uploadFileToGemini,
} from "@/utils/ai/gemini";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { CoreMessage } from "ai";
import { z } from "zod";
import { getServerUser } from "@/utils/auth/server";

// Define the response schema
const OnboardingResponseSchema = z.object({
  message: z.string().describe("The assistant's response to the user"),
  isComplete: z
    .boolean()
    .describe(
      "Whether enough information has been gathered to complete onboarding"
    ),
  candidateProfile: z
    .string()
    .optional()
    .describe("Markdown formatted candidate profile (only when complete)"),
});

export const POST = withAxiom(async (req: AxiomRequest) => {
  const formData = await req.formData();
  const conversationId = formData.get("conversationId") as string;
  const files = formData.getAll("files") as File[];
  const messages = JSON.parse(
    formData.get("messages") as string
  ) as CoreMessage[];

  const logger = req.log.with({
    conversationId,
    messageCount: messages.length,
    hasFiles: files.length > 0,
  });

  const supabase = await createSupabaseServerClient();

  // Get the current user
  const user = await getServerUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const userId = user.id;
  logger.info("Processing onboarding chat", { userId });

  // Handle file uploads if any
  const uploadedFiles: {
    type: "file";
    data: string;
    mimeType: string;
  }[] = [];

  if (files && files.length > 0) {
    for (const file of files) {
      const fileId = uuidv4();
      const fileBuffer = await file.arrayBuffer();

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(`${userId}/${fileId}`, fileBuffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        logger.error("File upload error", { error: uploadError });
        continue;
      }

      // Upload to Gemini for content extraction
      const blob = new Blob([fileBuffer], { type: file.type });
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
        added_to_memory: false, // Not using memories system for onboarding
      });

      if (fileError) {
        logger.error("Database file entry error", { error: fileError });
        continue;
      }

      uploadedFiles.push({
        type: "file",
        data: uploadResponse.file.uri,
        mimeType: uploadResponse.file.mimeType,
      });
    }
  }

  const systemPrompt = `You are a friendly onboarding assistant for Yorby, a platform that matches candidates with their ideal job opportunities.

Your goal is to gather three key pieces of information about the candidate.

CONVERSATION APPROACH:
${
  uploadedFiles.length > 0 &&
  `The user has uploaded files. Analyze them to understand their background, then focus on gathering the key information below.
    `
}

Focus your conversation on these 3 topics:

1. **Primary Role Interest**
   - What type of role are they looking for? (e.g., marketing, software engineer, finance, product manager, etc.)
   - Be specific about the role type and level they're targeting

2. **Experience in That Role**
   - What's their experience level in this type of role?
   - Key accomplishments or skills in this area
   - Years of experience
   - Notable projects or achievements

3. **Openness to Alternative Opportunities**
   - How open are they to roles outside their primary interest?
   - Would they consider opportunities in different industries?
   - Example: "Our AI matching sometimes finds unexpected fits - like a finance professional who'd be great for a UGC creator role. How open are you to exploring different types of opportunities?"

4. **Additional Information**
   - Ask the candidate if there is anything else that we should know about them that would help us match them with the best job opportunity.

CONVERSATION STYLE:
- Be conversational and warm
- Ask one topic at a time
- Keep it brief and focused
- Use casual language
- Don't be overly formal. Imagine you are a head hunter who is in their early to mid 30s and is trying to understand the candidate's background and career aspirations.
  Keep the tone friendly yet professional.

COMPLETION DETECTION:
You should mark isComplete as true when you have:
1. Their primary role interest
2. Their experience in that role
3. Their openness to alternative opportunities
4. Any additional information they provide (optional)

When marking complete, provide a markdown formatted candidateProfile with all gathered information using this structure:

# Candidate Profile

## Basic Information
- Name: [from resume or conversation]
- Email: [from resume or conversation]
- Location: [if available]

## Primary Role Interest
- Desired Role Type: [specific role they want]
- Target Level: [junior/mid/senior/executive]

## Experience & Background
- Years of Experience: [in target role]
- Key Skills: [relevant to their target role]
- Notable Achievements: [specific accomplishments]

## Flexibility
- Open to Other Roles: [yes/no/maybe]
- Openness Level: [very open/somewhat open/prefer to stick with target role]
- Alternative Industries Considered: [if mentioned]

## Additional Information
- Anything else that we should know about them that would help us match them with the best job opportunity.


When isComplete is true and you are going to send your final message to the user, quickly thank the user for their time and tell them that we will alert
them of any new job opportunities that we find that match their profile. In the mean time, we will redirect them to a page where they can prepare for any
job interview that they may have with mock interviews and practice questions.

Conduct the conversation in the language of the user.
`;

  const messagesWithContext: CoreMessage[] = [
    {
      role: "user",
      content: systemPrompt,
    },
    ...messages,
  ];

  // Add file context if files were uploaded
  if (uploadedFiles.length > 0) {
    messagesWithContext.unshift({
      role: "user",
      content: [
        {
          type: "text" as const,
          text: "I've uploaded my resume/documents for you to review.",
        },
        ...uploadedFiles.map((file) => ({
          type: "file" as const,
          data: file.data,
          mimeType: file.mimeType,
        })),
      ],
    });
  }

  try {
    // Generate response with structured output
    const response = await generateObjectWithFallback({
      messages: messagesWithContext,
      schema: OnboardingResponseSchema,
      loggingContext: {
        userId,
        conversationId: conversationId || "new",
        context: "onboarding",
      },
    });

    // If onboarding is complete, save the profile
    if (response.isComplete) {
      // Generate a properly formatted markdown profile if one wasn't provided
      const markdownProfile =
        response.candidateProfile ||
        (await generateCandidateProfile(
          [...messages, { role: "assistant", content: response.message }],
          userId,
          logger
        ));

      if (markdownProfile) {
        const { error: saveError } = await supabase
          .from("user_knowledge_base")
          .upsert({
            user_id: userId,
            knowledge_base: markdownProfile,
          });

        if (saveError) {
          logger.error("Error saving candidate profile", {
            error: saveError,
          });
        } else {
          logger.info("Candidate profile saved successfully", { userId });
        }
      }
    }
    logger.info("Successfully processed onboarding chat", {
      isComplete: response.isComplete,
    });
    return new Response(
      JSON.stringify({
        message: response.message,
        isComplete: response.isComplete,
      })
    );
  } catch (error) {
    logger.error("Error in onboarding chat", { error });
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

// Helper function to generate the markdown candidate profile
async function generateCandidateProfile(
  messages: CoreMessage[],
  userId: string,
  logger: Logger
): Promise<string | null> {
  try {
    const ProfileSchema = z.object({
      candidateProfile: z
        .string()
        .describe("Complete markdown formatted candidate profile"),
    });

    const structuringPrompt = `Based on this conversation, create a structured markdown profile for the candidate. Include all information gathered.

Use this exact markdown structure:

# Candidate Profile

## Basic Information
- Name: [name if provided]
- Email: [email if provided]
- Phone: [phone if provided]
- Location: [location if provided]

## Professional Summary
- Current Role: [role if provided]
- Years of Experience: [years if provided]
- Key Skills: [comma-separated skills if provided]

## Career Aspirations
- Desired Roles: [roles if provided]
- Industries of Interest: [industries if provided]
- Company Size Preference: [preference if provided]
- Work Arrangement: [remote/hybrid/onsite if provided]
- Location Preferences: [locations if provided]
- Open to Relocation: [yes/no if discussed]
- Salary Expectation: [range if provided]

## Culture & Values
- Important Values: [values if discussed]
- Deal Breakers: [deal breakers if mentioned]

## Additional Opportunities
- Open to: [list any mentioned: contract work, consulting, advisory roles, etc.]

## Demographics (Optional)
- Gender: [only if voluntarily provided]
- Race/Ethnicity: [only if voluntarily provided]
- Veteran Status: [only if voluntarily provided]
- Age Range: [only if voluntarily provided]

## Job Search Timeline
- Timeline: [actively looking, exploring, passive, etc. if discussed]
- Availability: [immediate, 2 weeks notice, specific date, etc. if mentioned]

For any fields where information wasn't provided, write "Not provided" or "Not discussed".

Generate the profile in the language of the user.`;

    const result = await generateObjectWithFallback({
      messages: [
        {
          role: "system",
          content: structuringPrompt,
        },
        {
          role: "user",
          content: `Here's the conversation to structure:\n\n${messages
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n\n")}`,
        },
      ],
      schema: ProfileSchema,
      loggingContext: {
        userId,
        action: "generate_candidate_profile",
      },
    });

    return result.candidateProfile;
  } catch (error) {
    logger.error("Error generating candidate profile", { error });
    return null;
  }
}
