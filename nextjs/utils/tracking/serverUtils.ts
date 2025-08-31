import PostHogClient from "@/app/posthog";
import { createSupabaseServerClient } from "../supabase/server";
import { getServerUser } from "../auth/server";

export const posthog = PostHogClient();
export const trackServerEvent = async ({
  userId,
  email,
  eventName,
  args = {},
}: {
  userId: string;
  email?: string;
  eventName: string;
  args?: { [_: string]: any };
}) => {
  let emailAddress = email;
  if (!emailAddress) {
    const user = await getServerUser();
    if (user) {
      emailAddress = user.email;
    }
  }
  posthog.capture({
    distinctId: userId,
    event: eventName,
    properties: { email: emailAddress, userId, ...args },
    sendFeatureFlags: true,
  });
  await posthog.shutdown();
};
