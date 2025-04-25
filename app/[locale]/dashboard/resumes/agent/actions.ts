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
            "aiPerformingActionString": string // A string that the AI will say back to the user when the AI starts performing
            the action. This should be in the first person and present tense and indicates the start of the action. It should be friendly and concise.
        }[],
        "response": string // A response to the user's prompt summarizing all of the actions that will be taken. This should be in
        the first person and present tense. It should be friendly and concise.
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
      modelConfig: {
        primaryModel: "gemini-2.5-pro-preview-03-25",
        fallbackModel: "gemini-2.5-flash-preview-04-17",
      },
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
        the tense should be in past tense indicating an action has been completed.
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
      modelConfig: {
        primaryModel: "gemini-2.5-pro-preview-03-25",
        fallbackModel: "gemini-2.5-flash-preview-04-17",
      },
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
        "response": string // A response describing what changes were made to the section. Keep the tone of the response casual and friendly and in the first person.
        the tense should be in past tense indicating an action has been completed.
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
        "response": string // A response confirming which section will be deleted. Keep the tone of the response casual and friendly and in the first person.
        the tense should be in past tense indicating an action has been completed.
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
        "response": string // A friendly, concise summary of all changes made. Keep the tone of the response casual and friendly and in the first person.
        the tense should be in past tense indicating an action has been completed. You should then end with a question asking the user if they would like to make any more changes.
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
      modelConfig: {
        primaryModel: "gemini-2.5-pro-preview-03-25",
        fallbackModel: "gemini-2.5-flash-preview-04-17",
      },
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

export const validateJobDescription = async (messages: CoreMessage[]) => {
  let logger = new Logger().with({
    function: "validateJobDescription",
    messages,
  });

  try {
    const { isValid, response } = await generateObjectWithFallback({
      systemPrompt: `
      You are a helpful assistant that validates whether a user has provided a valid job description or at the bare minimum a job title.
      
      You will receive the message history with a user. The most recent user message should contain the job description text.
      
      For the following prompt, perform these actions:
      1) Analyze the text to determine if it appears to be a legitimate job description
      2) Look for common job description elements like:
         - Role/position title
         - Company/organization context
         - Responsibilities or requirements
      3) The text doesn't need to be perfectly formatted, but should contain enough information to be recognizable as a job posting
      4) If the job description is not valid, respond with a friendly message explaining that the job description is not valid and providing guidance on what a job description should include.
      
      Return a JSON object with the following fields:
      {
          "isValid": boolean, // true if the text appears to be a valid job description
          "response": string // A friendly response explaining whether the text is valid and why. If invalid, provide guidance on what a job description should include.
          Keep the tone casual and helpful. Use first person.
      }
      `,
      messages,
      schema: z.object({
        isValid: z.boolean(),
        response: z.string(),
      }),
    });

    logger = logger.with({
      isValid,
      response,
    });
    logger.info("Job description validation completed");
    await logger.flush();
    return { isValid, response };
  } catch (error) {
    logger.error("Error validating job description", { error });
    await logger.flush();
    return {
      isValid: false,
      response:
        "Sorry, something went wrong while validating the job description. Please try again.",
    };
  }
};

export const identifyChanges = async (
  messages: CoreMessage[],
  currentResume: ResumeDataType
) => {
  let logger = new Logger().with({
    function: "identifyChanges",
    messages,
    currentResume,
  });

  try {
    const result = await generateObjectWithFallback({
      prompt: `
      You are a helpful assistant who takes a base resume and then updates it so that the resume is hyper-relevant to a job description to improve
      the chances that the owner of the resume will get an interview. Your goal is to make changes to the resume so that it is a stronger match for the job description,
      pass any ATS filters, and match any major keywords and responsibilities in the job description.
      
      You will receive:
      1. Message history containing the job description
      2. The current resume data
      
      Perform the following actions:
      1. You are an expert HR recruiter. Analyze the job description and create criteria for what would be a good resume for this job.
      2. Then, analyze the existing resume and all of its resume_sections and grade the resume against the criteria and identify
      how the resume could be improved. The one change you should NOT suggest is to add a work summary section. Our resumes
      WILL NOT HAVE A WORK SUMMARY SECTION so do not suggest this change.
      3. If the resume is already a strong match for the job description, return a response with type: "no_changes" and a friendly noChangeResponse message explaining that no changes are needed.
      4. If the resume could be improved, return a response with type: "changes_needed" and a list of improvements that could be made to the resume. 

      Return a discriminated union with either:
      {
        "type": "no_changes",
        "noChangeResponse": string, // A friendly response explaining that no changes are needed and that the resume is already a strong match for the job description.
      }
      OR
      {
        "type": "changes_needed",
        "changes": [{ 
            changeDescription: string, // LLM optimized detailed description of the change that needs to be made to the resume. The change 
            should be very detailed and should be explained in the context of how it would be a better match for the user provided job description. 
            Describe the change in the context of the job description and what changes need to be made to the resume to achieve the goal.
            changeId: string // A unique identifier for the change that can be used to update the resume. A short, succinct camel case string that is a brief description of the change
            changeType: "create_section" | "delete_section" | "update_section" // The type of change that needs to be made to the resume
        }], // A list of changes that could be made to the resume
        "changesRequireAdditionalInformation": boolean // true if the changes require additional information from the user, false otherwise
      }

      Only return resume changes that are truly necessary. Do not return changes that are not required by the job description. Do not return
      any changes that are unnecessary. For example, if the resume is already a strong match (for example if we were to use
      a scale of 1-10 where 10 is a perfect resume and 1 is a resume that is a horrible match for the job description, if the resume is 5/10 or higher, do not suggest any changes).
      Only return changes that would improve any large, glaring weaknesses in the resume.

      ## Message History
      ${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}

      ## Current Resume
      ${JSON.stringify(currentResume)}
      `,
      schema: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("no_changes"),
          noChangeResponse: z.string(),
        }),
        z.object({
          type: z.literal("changes_needed"),
          changes: z.array(
            z.object({
              changeDescription: z.string(),
              changeId: z.string(),
              changeType: z.enum([
                "create_section",
                "delete_section",
                "update_section",
              ] as const satisfies readonly ResumeActionType[]),
            })
          ),
          changesRequireAdditionalInformation: z.boolean(),
        }),
      ]),
      modelConfig: {
        primaryModel: "gemini-2.5-pro-preview-03-25",
        fallbackModel: "gemini-2.5-flash-preview-04-17",
      },
    });

    logger = logger.with({ result_type: result.type });
    logger.info("Change identification completed");
    await logger.flush();

    if (result.type === "no_changes") {
      return {
        changes: [],
        noChangeResponse: result.noChangeResponse,
        changesRequireAdditionalInformation: false,
      };
    } else {
      return {
        changes: result.changes,
        noChangeResponse: "",
        changesRequireAdditionalInformation:
          result.changesRequireAdditionalInformation,
      };
    }
  } catch (error) {
    logger.error("Error identifying changes", { error });
    await logger.flush();
    return {
      changes: [],
      noChangeResponse:
        "Sorry, something went wrong while analyzing your resume against the job description. Please try again.",
    };
  }
};

export const handleTransformConversation = async (
  messages: CoreMessage[],
  changesToBeMade: {
    changeDescription: string;
    changeId: string;
    changeType: ResumeActionType;
  }[],
  currentResume: ResumeDataType
) => {
  const logger = new Logger().with({
    function: "handleTransformConversation",
    messages,
    changesToBeMade,
    currentResume,
  });
  const { isReady, response } = await generateObjectWithFallback({
    systemPrompt: `You are a helpful assistant that chats with a user to get more information
    about the changes that need to be made to their resume.
    
    You will receive:
    1. The current resume
    2. A list of changes that need to be made to the resume  
    3. Current conversation with the user.

    Your job is to analyze the list of changes and ask the user for any additional information that they need to address the changes.

    For example if one of the changes is to add a new work experience to the resume, you should chat back and forth with the user
    until you get enough information to add the work experience to the resume.

    Not every change will require additional information from the user. Some changes will be clear and direct.

    When you determine that you have enough information to make all of the changes, respond with a message to the user indicating
    that you have enough information to make the changes and that you will now update the resume. 

    Return a JSON object with the following fields:
    {
      isReady: boolean, // true if you have enough information to make the changes, false otherwise
      response: string, // AI response to the user. This should be in the first person and present tense. It should be friendly and concise.
                        // In this response you should be asking the user for any additional information that they need to make the changes.
                        // Or if you have enough information, you should be telling the user that you have enough information to make the changes.
                        // Return your response in markdown format, but do not wrap your response in \`\`\`markdown tags. Just return the markdown text.
      changesToBeMade: [{ 
        changeDescription: string, // LLM optimized detailed description of the change that needs to be made to the resume
        changeId: string, // A unique identifier for the change that can be used to update the resume. A short, succinct camel case string that is a brief description of the change
        additionalChangeInformation: string | null, // Optional additional information that the user provides to make the change based off of the changeDescription. 
                                                    // If the change does not require additional information, this should be null.
        changeType: "create_section" | "delete_section" | "update_section" // The type of change that needs to be made to the resume
      }] // A list of changes that could be made to the resume
    }

    When responding to the user, make sure to include context from the job description the user included in the chat history as well as context from the current resume
    to provide extra insight as to why you are asking for certain information.

    ## Current Resume
    ${JSON.stringify(currentResume)}

    ## Changes to be Made
    ${JSON.stringify(changesToBeMade)}
    `,
    messages,
    schema: z.object({
      isReady: z.boolean(),
      response: z.string(),
      changesToBeMade: z.array(
        z.object({
          changeDescription: z.string(),
          changeId: z.string(),
          additionalChangeInformation: z.string().nullable(),
          changeType: z.enum([
            "create_section",
            "delete_section",
            "update_section",
          ] as const satisfies readonly ResumeActionType[]),
        })
      ),
    }),
    modelConfig: {
      primaryModel: "gemini-2.5-pro-preview-03-25",
      fallbackModel: "gemini-2.5-flash-preview-04-17",
    },
  });
  logger.info("Transform conversation completed", { isReady, response });
  await logger.flush();
  return { isReady, response };
};

export const generateTransformedResumeTitle = async (
  messages: CoreMessage[]
) => {
  const logger = new Logger().with({
    function: "generateTransformedResumeTitle",
  });

  try {
    const { title } = await generateObjectWithFallback({
      prompt: `
      You are an expert at creating concise and descriptive resume titles.
      
      First, analyze the message history to find the job description. The job description will be in a user message.
      Look for a message that contains typical job description elements like:
      - Role/position title
      - Company/organization context
      - Responsibilities or requirements
      
      Then, generate a professional and descriptive title (max 100 characters) for a resume that will be used for this job.
      The title should be clear and indicate the target role, optionally including the company name if provided in the job description.
      
      Examples of good titles:
      - "Senior Software Engineer - Google"
      - "Marketing Manager Resume"
      - "Product Designer - Healthcare Industry"
      - "Financial Analyst - JP Morgan"
      
      Message History:
      ${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}

      Return the title in JSON format:
      {
        "title": string // The generated title, max 100 characters
      }
      `,
      schema: z.object({
        title: z.string().max(100),
      }),
    });

    logger.info("Title generation completed", { title });
    await logger.flush();
    return { title };
  } catch (error) {
    logger.error("Error generating title", { error });
    await logger.flush();
    return { title: "Resume" }; // Fallback to generic title if generation fails
  }
};

export const generateTransformationSummary = async (
  changes: {
    changeDescription: string;
    changeId: string;
    changeType: ResumeActionType;
    additionalChangeInformation?: string | null;
  }[],
  messages: CoreMessage[] = []
) => {
  const logger = new Logger().with({
    function: "generateTransformationSummary",
  });

  try {
    const { summary } = await generateObjectWithFallback({
      prompt: `
      You are an expert resume writer helping users understand how their resume has been optimized.
      
      The following changes have been made to a user's resume to better match a job description:
      ${JSON.stringify(changes)}
      
      Here's the conversation history that led to these changes (this contains the job description):
      ${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}
      
      Create a concise, friendly summary (max 500 characters) that explains the key changes made to the resume.
      The summary should:
      1. Start with a warm welcome message like "Welcome to your transformed resume!" or similar
      2. Briefly mention the most changes that were made to the resume
      3. Focus on how these changes improve the resume for the target job
      4. Be encouraging and positive
      5. Avoid being overly verbose or listing every single change
      6. Be concise and to the point
      7. Speak in first person and use the word "I"
      8. End the message letting the user know that if they want to make any changes to the resume,
      they can just ask you to do so.
      
      Return the summary in JSON format:
      {
        "summary": string // The generated summary, max 500 characters
      }
      `,
      schema: z.object({
        summary: z.string().max(500),
      }),
    });

    logger.info("Summary generation completed", { summary });
    await logger.flush();
    return { summary };
  } catch (error) {
    logger.error("Error generating summary", { error });
    await logger.flush();
    return {
      summary:
        "Welcome to your transformed resume! I've updated it to better match the job description. Take a look at the changes I made! If you'd like to make any additional adjustments, just let me know.",
    }; // Fallback to generic summary if generation fails
  }
};
