import PostHogClient from "@/app/posthog";

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
  posthog.capture({
    distinctId: userId,
    event: eventName,
    properties: { email, userId, ...args },
  });
  await posthog.shutdown();
};
