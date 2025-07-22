import { headers } from "next/headers";

/**
 * Gets the origin (protocol + host) from request headers in a server component
 * @returns The full origin URL (e.g., "https://example.com")
 */
export async function getServerOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}