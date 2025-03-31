"use server";

import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { z } from "zod";
import { ResumeDataType } from "../components/ResumeBuilder";
import { Logger } from "next-axiom";
import { CoreMessage } from "ai";

export type ResumeActionType =
  | "create_section"
  | "delete_section"
  | "update_section"
  | "update_contact_info"
  | "other";

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

export const triageAction = async (
  messages: CoreMessage[],
  currentResume: ResumeDataType
) => {
  let logger = new Logger().with({
    function: "triageAction",
    messages,
    currentResume,
  });
  try {
    const { actions, response } = await generateObjectWithFallback({
      prompt: `
    You are a helpful assistant that triages user messages into actions.

    From the following message history, determine the actions that need to be taken on the resume. 

    Youre response should be a JSON object with the following fields:
    {
        actions: {
            "action": "create_section" | "delete_section" | "update_section" | "update_contact_info" | "other",
            "actionDetails": string // A detailed explanation of the action that will be taken
            "aiPerformingActionString": string // A string that the AI will say back to the user when performing the action
        }[],
        "response": string // A response to the user's prompt summarizing all of the actions that will be taken
    }

    A section is a collection of list items and detail items.
    An example of a common section is the "Work Experience" section or an "Education" section or a "Skills" section.

    The following actions are available:

    1. create_section: Create a new section if the user wants to add new information to the resume but it does not fit into one of the existing sections.
    For example, if the user wants to add a new work experience there does not exist a "Work Experience" section, so you should create one.
    Read through the existing resume's sections and only create a new section if there is not a section that fits the user's request.
    2. delete_section: Delete a section if the user wants to remove a section from the resume.
    3. update_section: Update a section if the user wants to update the content of an existing section. For example, if the user wants to add a new work experience to the
    "Work Experience" section, you should update the "Work Experience" section. Read through the existing resume's sections and only update the section
    if there is a section that fits the user's request.
    4. update_contact_info: Update the resume's contact information (name, email, phone, location) when the user wants to modify any of these fields.
    5. other: A catch-all action for any resume updates that don't fit into the above categories. 

    IMPORTANT: Only use the "other" action as a last resort when the requested changes cannot be handled by any of the more specific actions.
    Always try to use the more specific actions first.

    Return the LEAST NUMBER OF ACTIONS POSSIBLE to complete the user's request. Do your best to not add any extra sections if possible
    and err on the side of updating existing sections. Only create a new section if you absolutely have to.

    For your response, include a "response" field that summarizes the actions that will be taken. Keep the tone of your
    response casual and friendly.

    Return the actions in the most logical order for the resume to be edited.

    ## Message History
    ${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}

    ## Current Resume
    ${JSON.stringify(currentResume)}
    `,
      schema: z.object({
        actions: z.array(
          z.object({
            action: z.enum([
              "create_section",
              "delete_section",
              "update_section",
              "update_contact_info",
              "other",
            ] as const satisfies readonly ResumeActionType[]),
            actionDetails: z.string(),
            aiPerformingActionString: z.string(),
          })
        ),
        response: z.string(),
      }),
    });
    logger = logger.with({
      actions,
      response,
    });
    logger.info("Triage action completed");
    await logger.flush();
    return { actions, response };
  } catch (error) {
    logger.error("Error triaging action", { error });
    await logger.flush();
    return {
      actions: null,
      response: "Sorry, something went wrong. Please try again.",
    };
  }
};

export const createSection = async (
  messages: CoreMessage[],
  currentResume: ResumeDataType,
  actionDetails: string
) => {
  let logger = new Logger().with({
    function: "createSection",
    messages,
    currentResume,
  });
  try {
    const { resumeSection, response } = await generateObjectWithFallback({
      prompt: `
    You are a helpful assistant that is going to create a new section for a resume.

    You will receive the message history with a user, the current resume, and the details of the action that will be taken.

    For the following prompt, perform the following actions to create a section in a resume:

    0) Read the actionDetails, understand what the user wants to add to the resume, and extract the necessary information
    from the prompt that the actionDetails needs to perform the createSection action.
    1) Identify the heading of the new section that needs to be created. Example: "Work Experience", "Education", "Skills", "Projects", "Certifications", "Publications", "Awards", "Leadership", "Volunteering", "Extracurricular Activities", "Other"
    2) Identify if the section requires a list of items or detail items. A section should be a list item section if the
    information being added is straightforward and does not need additional context or explanation. An example of a list item section
    is "Skills" where the skill is just a list like "Python", "JavaScript", "React", "Node.js" that doesn't need additional bullet
    points explaining the skill. An example of a detail item section is "Work Experience" where the work experience is a detailed
    description of the user's role, responsibilities, and accomplishments at a company. The company name would be the title of
    the section, the position would be the subtitle, and then the additional details of what the individual did at the company
    would be the resumeItemDescriptions. 

    IMPORTANT: A section must have either ONLY list items or ONLY detail items. It cannot have both.

    IMPORTANT: You are an expert resume builder and the resume section you are creating should always be in the proper format to be ATS
    compatible and to maximize the chances of the user getting an interview.

    Return a JSON object with the following fields:
    {
        "resumeSection": resumeSectionsSchema type,
        "response": string // A summary of the section that was created. Keep the tone of the response casual and friendly and in the first person.
    }

    ## Message History
    ${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}

    ## Action Details
    ${actionDetails}

    ## Current Resume
    ${JSON.stringify(currentResume)}
    `,
      schema: z.object({
        resumeSection: resumeSectionsSchema,
        response: z.string(),
      }),
    });
    logger = logger.with({
      resumeSection,
      response,
    });
    logger.info("Create section completed");
    await logger.flush();
    return { resumeSection, response };
  } catch (error) {
    logger.error("Error creating section", { error });
    await logger.flush();
    return {
      resumeSection: null,
      response: "Sorry, something went wrong. Please try again.",
    };
  }
};

export const updateSection = async (
  messages: CoreMessage[],
  currentResume: ResumeDataType,
  actionDetails: string
) => {
  let logger = new Logger().with({
    function: "updateSection",
    messages,
    currentResume,
  });
  try {
    const { resumeSection, response } = await generateObjectWithFallback({
      prompt: `
    You are a helpful assistant that updates an existing section in a resume.

    You will receive the message history with a user, the current resume, and the details of the action that will be taken.

    For the following prompt, perform these actions to update a section in the resume:

    0) Read the actionDetails, understand what the user wants to update in the resume, and extract the necessary information
    from the prompt that the actionDetails needs to perform the updateSection action.
    1) Identify which section needs to be updated based on the user's prompt
    2) Determine what changes need to be made to the section (e.g., updating content, adding/removing items, reordering items, etc.)
    3) If the updated resume section resume_list_items is not empty, update the list items as needed. If you are need to add a new list item,
    create a new resumeListItem object and append it to the resume_list_items array.
    4) If the updated resume section resume_detail_items is not empty, update the detail items as needed. A resume detail item is one object
    that has a title, subtitle, and an array of resumeItemDescriptions. An example of a resume detail item
    would be the the company in a work experience and then the resumeItemDescription would be the details
    of what the user did at the company. Determine whether you need to update a resume detail item (e.g.update the title, subtitle, date_range)
    or if you need to modify the resumeItemDescriptions in an existing resumeDetailItem. 
    5) Only change the resume section's type (e.g. from list item to detail item or from detail item to list item) if the user explicitly
    asks for it.

    A resume action has the following schema written in zod:

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

    Return a JSON object with the following fields:
    {
        "resumeSection": resumeSectionsSchema type | null, // The updated section or null if the section does not exist
        "response": string // A response describing what changes were made to the section
    }

    ## Message History
    ${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}

    ## Action Details
    ${actionDetails}

    ## Current Resume
    ${JSON.stringify(currentResume)}
    `,
      schema: z.object({
        resumeSection: resumeSectionsSchema.nullable(),
        response: z.string(),
      }),
    });
    logger = logger.with({
      resumeSection: JSON.stringify(resumeSection),
      response,
    });
    logger.info("Update section completed");
    await logger.flush();
    return { resumeSection, response };
  } catch (error) {
    logger.error("Error updating section", { error });
    await logger.flush();
    return {
      resumeSection: null,
      response: "Sorry, something went wrong. Please try again.",
    };
  }
};

export const deleteSection = async (
  messages: CoreMessage[],
  currentResume: ResumeDataType
) => {
  let logger = new Logger().with({
    function: "deleteSection",
    messages,
    currentResume,
  });
  try {
    const { sectionId, response } = await generateObjectWithFallback({
      prompt: `
    You are a helpful assistant that deletes sections from a resume.

    You will receive the message history with a user, the current resume, and the details of the action that will be taken.

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

    ## Message History
    ${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}

    ## Current Resume
    ${JSON.stringify(currentResume)}
    `,
      schema: z.object({
        sectionId: z.string().nullable(),
        response: z.string(),
      }),
    });
    logger = logger.with({
      sectionId,
      response,
    });
    logger.info("Delete section completed");
    await logger.flush();
    return { sectionId, response };
  } catch (error) {
    logger.error("Error deleting section", { error });
    await logger.flush();
    return {
      sectionId: null,
      response: "Sorry, something went wrong. Please try again.",
    };
  }
};

export const generateConclusionMessage = async (
  actionResponses: { action: ResumeActionType; response: string }[]
) => {
  let logger = new Logger().with({
    function: "generateConclusionMessage",
    actionResponses,
  });
  try {
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
    logger = logger.with({
      response,
    });
    logger.info("Generate conclusion message completed");
    await logger.flush();
    return response;
  } catch (error) {
    logger.error("Error generating conclusion message", { error });
    await logger.flush();
    return "Sorry, something went wrong. Please try again.";
  }
};

export const updateContactInfo = async (
  messages: CoreMessage[],
  currentResume: ResumeDataType,
  actionDetails: string
) => {
  let logger = new Logger().with({
    function: "updateContactInfo",
    messages,
    currentResume,
  });
  try {
    const { updatedResume, response } = await generateObjectWithFallback({
      prompt: `
    You are a helpful assistant that updates contact information in a resume.

    You will receive the message history with a user, the current resume, and the details of the action that will be taken.

    For the following prompt, perform these actions:
    1) Read the actionDetails and understand what contact information needs to be updated
    2) Only update the fields that are explicitly mentioned in the actionDetails
    3) Preserve all existing values for fields not mentioned in the update
    4) Update the following fields if mentioned: email, name, phone, location

    Return a JSON object with the following fields:
    {
        "updatedResume": {
            email: string | null,
            name: string,
            phone: string | null,
            location: string | null
        },
        "response": string // A friendly response describing what contact information was updated
    }

    ## Message History
    ${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}

    ## Action Details
    ${actionDetails}

    ## Current Resume
    ${JSON.stringify(currentResume)}
    `,
      schema: z.object({
        updatedResume: z.object({
          email: z.string().nullable(),
          name: z.string(),
          phone: z.string().nullable(),
          location: z.string().nullable(),
        }),
        response: z.string(),
      }),
    });
    logger = logger.with({
      updatedResume,
      response,
    });
    logger.info("Update contact info completed");
    await logger.flush();
    return { updatedResume, response };
  } catch (error) {
    logger.error("Error updating contact info", { error });
    await logger.flush();
    return {
      updatedResume: null,
      response: "Sorry, something went wrong. Please try again.",
    };
  }
};

export const handleOtherAction = async (
  messages: CoreMessage[],
  currentResume: ResumeDataType,
  actionDetails: string
) => {
  let logger = new Logger().with({
    function: "handleOtherAction",
    messages,
    currentResume,
  });
  try {
    const { updatedResume, response } = await generateObjectWithFallback({
      prompt: `
    You are a helpful assistant that handles miscellaneous resume updates that don't fit into other specific actions.

    You will receive the message history with a user, the current resume, and the details of the action that will be taken.

    For the following prompt, perform these actions:
    1) Read the actionDetails and understand what changes need to be made to the resume
    2) Make only the necessary changes to the resume while preserving all other existing data

    Return a JSON object with the following fields:
    {
        "updatedResume": resumeSchema,
        "response": string // A friendly response describing what changes were made to the resume
    }

    ## Message History
    ${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}

    ## Action Details
    ${actionDetails}

    ## Current Resume
    ${JSON.stringify(currentResume)}
    `,
      schema: z.object({
        updatedResume: resumeSchema,
        response: z.string(),
      }),
    });
    logger = logger.with({
      updatedResume,
      response,
    });
    logger.info("Other action completed");
    await logger.flush();
    return { updatedResume, response };
  } catch (error) {
    logger.error("Error handling other action", { error });
    await logger.flush();
    return {
      updatedResume: null,
      response: "Sorry, something went wrong. Please try again.",
    };
  }
};
