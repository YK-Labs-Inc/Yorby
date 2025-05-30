"use client";

import { UploadResponse } from "@/utils/types";
import { useState } from "react";
import FileUpload from "./FileUpload";
import InterviewCopilotDemoSession from "./InterviewCopilotDemoSession";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslations } from "next-intl";
import { Monitor } from "lucide-react";
import { User } from "@supabase/supabase-js";
export default function InterviewCopilotDemoClientComponent({
  signedUrl,
  user,
}: {
  signedUrl: string;
  user: User | null;
}) {
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(
    null
  );
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <div className="h-full w-full flex flex-col justify-center items-center">
        <MobileWarning />
      </div>
    );
  }
  return uploadResponse ? (
    <InterviewCopilotDemoSession
      uploadResponse={uploadResponse}
      signedUrl={signedUrl}
      user={user}
    />
  ) : (
    <FileUpload setUploadResponse={setUploadResponse} />
  );
}

const MobileWarning = () => {
  const t = useTranslations("interviewCopilotDemo.mobileWarning");
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center gap-4 rounded-lg border bg-card text-card-foreground shadow-sm">
      <Monitor className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">{t("title")}</h2>
      <p className="text-muted-foreground">{t("description")}</p>
    </div>
  );
};
