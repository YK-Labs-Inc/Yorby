import dynamic from "next/dynamic";
import { AssemblyAI } from "assemblyai";
import { Session } from "./components/session";

async function generateAssemblyAIToken() {
  const apiKey = process.env.ASSEMBLY_AI_API_KEY;
  if (!apiKey) {
    throw new Error("ASSEMBLY_AI_API_KEY is not set in environment variables");
  }

  const assembly = new AssemblyAI({
    apiKey,
  });

  try {
    const token = await assembly.realtime.createTemporaryToken({
      expires_in: 36000, // 10 hours
    });
    return token;
  } catch (error) {
    console.error("Error generating AssemblyAI token:", error);
    throw error;
  }
}

export default async function OnDeviceSessionPage() {
  const temporaryToken = await generateAssemblyAIToken();

  return <Session temporaryToken={temporaryToken} />;
}
