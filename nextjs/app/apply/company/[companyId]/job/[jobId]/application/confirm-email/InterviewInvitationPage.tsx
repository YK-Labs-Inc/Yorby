"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Video, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import { InterviewCompletionMessage } from "../../candidate-interview/[candidateInterviewId]/InterviewCompletionMessage";

interface InterviewInvitationPageProps {
  redirectUrl: string;
}

export default function InterviewInvitationPage({
  redirectUrl,
}: InterviewInvitationPageProps) {
  const t = useTranslations("apply.interviewInvitation");
  const [showSkipDialog, setShowSkipDialog] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto h-16 w-16 text-blue-600">
          <Video className="h-16 w-16" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{t("title")}</h3>
        <p className="text-gray-600 max-w-lg mx-auto">{t("description")}</p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-lg">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-xs text-white font-bold">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-900">
                {t("features.shareExperience.title")}
              </h4>
              <p className="text-sm text-blue-700">
                {t("features.shareExperience.description")}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-xs text-white font-bold">⚡</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-900">
                {t("features.multipleQuestions.title")}
              </h4>
              <p className="text-sm text-blue-700">
                {t("features.multipleQuestions.description")}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-xs text-white font-bold">🎯</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-900">
                {t("features.quickConvenient.title")}
              </h4>
              <p className="text-sm text-blue-700">
                {t("features.quickConvenient.description")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href={redirectUrl} className="flex-1">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium">
            <Video className="w-5 h-5 mr-2" />
            {t("buttons.startAssessment")}
          </Button>
        </Link>

        <Button
          variant="outline"
          className="flex-1 py-3 text-base font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={() => setShowSkipDialog(true)}
        >
          <SkipForward className="w-5 h-5 mr-2" />
          {t("buttons.skipForNow")}
        </Button>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500">{t("footer")}</p>
      </div>

      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent className="max-w-md">
          <InterviewCompletionMessage />
        </DialogContent>
      </Dialog>
    </div>
  );
}
