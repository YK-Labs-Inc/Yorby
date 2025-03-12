"use client";

import { UploadResponse } from "@/utils/types";
import { useState } from "react";
import FileUpload from "./FileUpload";
import InterviewCopilotDemoSession from "./InterviewCopilotDemoSession";

export default function InterviewCopilotDemoClientComponent({
  signedUrl,
}: {
  signedUrl: string;
}) {
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(
    null
  );
  return uploadResponse ? (
    <InterviewCopilotDemoSession
      uploadResponse={uploadResponse}
      signedUrl={signedUrl}
    />
  ) : (
    <FileUpload setUploadResponse={setUploadResponse} />
  );
}
