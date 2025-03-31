"use server";

import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { z } from "zod";
import { ResumeDataType } from "../components/ResumeBuilder";

export type ResumeActionType =
  | "create_section"
  | "delete_section"
  | "update_section";

const resumeItemDescriptionsSchema = z.object({
  created_at: z.string().nullable(),
  description: z.string(),
  detail_item_id: z.string(),
  display_order: z.number(),
  id: z.string(),
  updated_at: z.string().nullable(),
});

const resumeDetailItemsSchema = z.object({
  created_at: z.string().nullable(),
  date_range: z.string().nullable(),
  display_order: z.number(),
  id: z.string(),
  section_id: z.string(),
  subtitle: z.string().nullable(),
  title: z.string(),
  updated_at: z.string().nullable(),
  resume_item_descriptions: z.array(resumeItemDescriptionsSchema),
});

const resumeListItemsSchema = z.object({
  content: z.string(),
  created_at: z.string().nullable(),
  display_order: z.number(),
  id: z.string(),
  section_id: z.string(),
  updated_at: z.string().nullable(),
});

const resumeSectionsSchema = z.object({
  created_at: z.string().nullable(),
  display_order: z.number(),
  id: z.string(),
  resume_id: z.string(),
  title: z.string(),
  updated_at: z.string().nullable(),
  resume_list_items: z.array(resumeListItemsSchema),
  resume_detail_items: z.array(resumeDetailItemsSchema),
});

const resumeSchema = z.object({
  created_at: z.string().nullable(),
  email: z.string().nullable(),
  id: z.string(),
  location: z.string().nullable(),
  locked_status: z.enum(["locked", "unlocked"]),
  name: z.string(),
  phone: z.string().nullable(),
  summary: z.string().nullable(),
  title: z.string(),
  updated_at: z.string().nullable(),
  user_id: z.string(),
  resume_sections: z.array(resumeSectionsSchema),
});

export const triageAction = async (prompt: string) => {
  const { actions, response } = await generateObjectWithFallback({
    prompt: `
     You are a helpful assistant that triages user prompts into actions.
     From the following prompt, determine the actions that need to be taken on the resume. 
     Youre response should be a JSON object with the following fields:
     {
         actions: {
             "action": "create_section" | "delete_section" | "update_section",
             "response": string // A brief description of the action that will be taken
         }[],
         "response": string // A response to the user's prompt summarizing all of the actions that will be taken
     }
     A section is a collection of list items and detail items.
     An example of a common section is the "Work Experience" section or an "Education" section or a "Skills" section.
     Create a new section if the user wants to add new information to the resume but it does not fit into an existing section.
     Delete a section if the user wants to remove a section from the resume.
     Update a section if the user wants to update the content of an existing section.
     Return the actions in the most logical order for the resume to be edited
     `,
    schema: z.object({
      actions: z.array(
        z.object({
          action: z.enum([
            "create_section",
            "delete_section",
            "update_section",
          ] as const satisfies readonly ResumeActionType[]),
          response: z.string(),
        })
      ),
      response: z.string(),
    }),
  });
  return { actions, response };
};

export const createSection = async (
  prompt: string,
  currentResume: ResumeDataType
) => {
  const { resumeSection, response } = await generateObjectWithFallback({
    prompt: `
     You are a helpful assistant that creates a section for the resume.
     You will receive a prompt from the user and the current resume.
     For the following prompt, perform the following actions to create a section in a resume:
     1) Identify the heading of the new section that needs to be created. Example: "Work Experience", "Education", "Skills", "Projects", "Certifications", "Publications", "Awards", "Leadership", "Volunteering", "Extracurricular Activities", "Other"
     2) Identify if the section requires a list of items or detail items.
     3) If the section requires a list of items, identify the items that need to be added to the list. If the section
     requires detail items, identify the items that need to be added to the detail items. It must be one or the other.
     5) If the section requires no items, return a placeholder detail items section with placeholder content filled out .
     Return a JSON object with the following fields:
     {
         "resumeSection": resumeSectionsSchema type,
         "response": string // A response to the user's prompt acknowledging the section that was created 
     }
     ## Prompt
     ${prompt}
     ## Current Resume
     ${JSON.stringify(currentResume)}
     `,
    schema: z.object({
      resumeSection: resumeSectionsSchema,
      response: z.string(),
    }),
  });
  return { resumeSection, response };
};

export const updateSection = async (
  prompt: string,
  currentResume: ResumeDataType
) => {
  const { resumeSection, response } = await generateObjectWithFallback({
    prompt: `
     You are a helpful assistant that updates sections in a resume.
     You will receive a prompt from the user and the current resume.
     For the following prompt, perform these actions to update a section in the resume:
     1) Identify which section needs to be updated based on the user's prompt
     2) Determine what changes need to be made to the section (e.g., updating content, adding/removing items, reordering items, etc.)
     3) If the section uses list items, update/add/remove list items as needed
     4) If the section uses detail items, update/add/remove detail items and their descriptions as needed
     5) Preserve any existing content that doesn't need to be changed
     6) Ensure all display_order fields are maintained correctly
     7) If the section does not exist, return a null resumeSection and a response saying that the section does not exist.
     Return a JSON object with the following fields:
     {
         "resumeSection": resumeSectionsSchema type | null, // The updated section or null if the section does not exist
         "response": string // A response describing what changes were made to the section
     }
     ## Prompt
     ${prompt}
     ## Current Resume
     ${JSON.stringify(currentResume)}
     `,
    schema: z.object({
      resumeSection: resumeSectionsSchema.nullable(),
      response: z.string(),
    }),
  });
  return { resumeSection, response };
};

export const deleteSection = async (
  prompt: string,
  currentResume: ResumeDataType
) => {
  const { sectionId, response } = await generateObjectWithFallback({
    prompt: `
     You are a helpful assistant that deletes sections from a resume.
     You will receive a prompt from the user and the current resume.
     For the following prompt, perform these actions:
     1) Identify which section needs to be deleted based on the user's prompt
     2) Confirm that the section exists in the current resume
     3) Return the section ID that needs to be deleted
     Return a JSON object with the following fields:
     {
         "sectionId": string | null, // The ID of the section to delete if it exists, otherwise null
         "response": string // A response confirming which section will be deleted
     }
     If the secion does not exist, return a null sectionId and a response saying that the section does not exist.
     ## Prompt
     ${prompt}
     ## Current Resume
     ${JSON.stringify(currentResume)}
     `,
    schema: z.object({
      sectionId: z.string().nullable(),
      response: z.string(),
    }),
  });
  return { sectionId, response };
};

export const generateConclusionMessage = async (
  actionResponses: { action: ResumeActionType; response: string }[]
) => {
  const { response } = await generateObjectWithFallback({
    prompt: `
     You are a helpful assistant that summarizes the changes made to a resume.
     You will receive an array of actions and their responses that were taken on the resume.
     Create a friendly, concise summary of all the changes that were made.
     Keep the tone positive and encouraging, even if some actions couldn't be completed.
     Focus on what was accomplished while acknowledging any limitations or issues.
     Return a JSON object with the following fields:
     {
         "response": string // A friendly, concise summary of all changes made
     }
     ## Action Responses
     ${JSON.stringify(actionResponses)}
     `,
    schema: z.object({
      response: z.string(),
    }),
  });
  return response;
};
