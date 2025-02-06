"use server";

export const processInterviewCopilot = async (data: FormData) => {
  const interviewCopilotId = data.get("interviewCopilotId") as string;
  const transcript = data.get("transcript") as string;
};
