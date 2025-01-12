import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: [
    "en",
    "zh",
    "hi",
    "es",
    "bn",
    "fr",
    "pt",
    "ru",
    "id",
    "de",
    "ja",
    "sw",
    "mr",
    "te",
    "vi",
    "ta",
    "ko",
    "it",
    "th",
    "pl",
    "gu",
    "uk",
    "kn",
    "ml",
    "tl",
    "ro",
    "nl",
    "ms",
    "or",
    "my",
    "hu",
    "cs",
    "el",
    "sv",
    "bg",
    "ne",
    "sk",
    "da",
    "fi",
    "no",
    "hr",
    "lt",
    "km",
    "mn",
    "lo",
    "et",
    "sl",
    "lv",
    "sq",
    "mk",
  ],

  // Used when no locale matches
  defaultLocale: "en",
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
