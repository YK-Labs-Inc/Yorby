import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const locale = "en";

  // Load the main messages file (fallback for existing keys)
  let mainMessages = {};
  try {
    mainMessages = (await import(`../messages/${locale}.json`)).default;
  } catch (error) {
    console.warn(`Failed to load main messages for ${locale}`, error);
  }

  // Load feature-specific message files
  let applyMessages = {};
  try {
    applyMessages = (await import(`../messages/${locale}/apply.json`)).default;
  } catch (error) {
    // It's okay if the file doesn't exist yet
    console.info(`Apply messages not found for ${locale}, using defaults`);
  }

  let commonMessages = {};
  try {
    commonMessages = (await import(`../messages/${locale}/common.json`))
      .default;
  } catch (error) {
    // It's okay if the file doesn't exist yet
    console.info(`Common messages not found for ${locale}, using defaults`);
  }

  let authMessages = {};
  try {
    authMessages = (await import(`../messages/${locale}/auth.json`)).default;
  } catch (error) {
    // It' okay if the file doesn't exist yet
    console.info(`Auth messages not found for ${locale}, using defaults`);
  }

  let companyMessages = {};
  try {
    companyMessages = (await import(`../messages/${locale}/company.json`))
      .default;
  } catch (error) {
    // It's okay if the file doesn't exist yet
    console.info(`Company messages not found for ${locale}, using defaults`);
  }

  let onboardingMessages = {};

  try {
    onboardingMessages = (await import(`../messages/${locale}/onboarding.json`))
      .default;
  } catch (error) {
    // It's okay if the file doesn't exist yet
    console.info(`Onboarding messages not found for ${locale}, using defaults`);
  }

  let purchaseMessages = {};
  try {
    purchaseMessages = (await import(`../messages/${locale}/purchase.json`))
      .default;
  } catch (error) {
    // It's okay if the file doesn't exist yet
    console.info(`Purchase messages not found for ${locale}, using defaults`);
  }

  let landingPageV7Messages = {};

  try {
    landingPageV7Messages = (
      await import(`../messages/${locale}/landingPageV7.json`)
    ).default;
  } catch (error) {
    // It's okay if the file doesn't exist yet
    console.info(
      `Landing page v7 messages not found for ${locale}, using defaults`
    );
  }

  // Merge all messages
  // Feature-specific messages override main messages if there are conflicts
  const messages = {
    ...mainMessages,
    apply: applyMessages,
    common: commonMessages,
    auth: authMessages,
    company: companyMessages,
    onboarding: onboardingMessages,
    purchase: purchaseMessages,
    landingPageV7: landingPageV7Messages,
  };

  return {
    locale,
    messages,
  };
});
