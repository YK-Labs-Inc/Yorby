import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    getMessageFallback: getMessageFallback,
  };
});

export const getMessageFallback = ({
  key,
  namespace,
}: {
  key: string;
  namespace?: string;
}) => {
  // Load the message from the default locale
  const defaultMessages = require(`../messages/${routing.defaultLocale}.json`);

  // Combine and split all parts by dots, whether they come from namespace or key
  const parts = [...(namespace ? namespace.split(".") : []), ...key.split(".")];

  // Navigate through nested namespaces if they exist
  let fallbackMessage = defaultMessages;

  for (const part of parts) {
    if (!fallbackMessage || typeof fallbackMessage !== "object") {
      return undefined;
    }
    fallbackMessage = fallbackMessage[part];
  }

  return fallbackMessage;
};
