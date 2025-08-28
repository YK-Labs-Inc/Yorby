import * as SibApiV3Sdk from "@sendinblue/client";
import { posthog, trackServerEvent } from "@/utils/tracking/serverUtils";
import { Logger } from "next-axiom";
import { User } from "@supabase/supabase-js";

export const getRedirectToOnboardingV2 = async (user: User) => {
  const memoriesEnabled = Boolean(
    await posthog.isFeatureEnabled("enable-memories", user.id)
  );
  if (!memoriesEnabled) {
    return false;
  }
  const userHasFinishedMemoriesOnboarding =
    await completedMemoriesOnboarding(user);
  if (userHasFinishedMemoriesOnboarding) {
    return false;
  }

  return memoriesEnabled && !userHasFinishedMemoriesOnboarding;
};

const completedMemoriesOnboarding = async (user: User) =>
  Boolean(user.app_metadata["completed-memories-onboarding"]);

export const addUserToBrevo = async ({
  userId,
  email,
  logger,
  origin,
}: {
  userId: string;
  email: string;
  logger: Logger;
  origin: string;
}) => {
  try {
    if (process.env.NODE_ENV === "development") {
      return true;
    }
    let apiInstance = new SibApiV3Sdk.ContactsApi();
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY is not set");
    }
    apiInstance.setApiKey(SibApiV3Sdk.ContactsApiApiKeys.apiKey, brevoApiKey);

    let brevoListId: null | number = null;
    if (origin.includes("yorby.ai")) {
      brevoListId = 9;
    } else if (origin.includes("perfectinterview.ai")) {
      brevoListId = 6;
    }

    if (!brevoListId) {
      logger.error("No Brevo list ID found for origin", { origin });
      return false;
    }

    try {
      // Check if contact already exists
      logger.info("Checking if contact exists in Brevo", { email });
      await apiInstance.getContactInfo(email);
      logger.info("Contact already exists in Brevo. Skipping creation.", {
        email,
      });
      return false;
    } catch (error: any) {
      // Brevo throws an error if the contact does not exist
      logger.info("Brevo contact not found. Proceeding to create.", {
        error,
        email,
      });
      let createContact = new SibApiV3Sdk.CreateContact();
      createContact.email = email;
      createContact.listIds = [brevoListId]; // Ensure this list ID is correct

      await apiInstance.createContact(createContact);
      logger.info("Added contact to Brevo", { email });
      await trackServerEvent({
        userId,
        email,
        eventName: "user_sign_up", // Or a different event if you want to distinguish these cases
        args: {
          email,
        },
      });
      return true;
    }
  } catch (error: any) {
    // This outer catch handles errors from API key setup or if createContact itself fails
    // when called in the "else" block above or if the initial getContactInfo check error was re-thrown.
    logger.error("Failed to add user to Brevo", { error, email });
    return false;
  }
};
