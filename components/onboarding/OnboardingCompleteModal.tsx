import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { FileText, MessageSquare, Users } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "../ui/card";

export function OnboardingCompleteModal() {
  const t = useTranslations("knowledgeBase");
  const [showCongratulations, setShowCongratulations] = useState(false);

  return (
    <Dialog open={showCongratulations} onOpenChange={setShowCongratulations}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            {t("congratulations")}
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            {t("congratulationsDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <Link href="/dashboard/resumes">
            <Card className="flex items-center gap-6 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex-shrink-0">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <div className="flex-grow text-left">
                <h4 className="text-xl font-semibold text-gray-900 mb-1">
                  {t("buildResume")}
                </h4>
                <p className="text-gray-600">{t("buildResumeDescription")}</p>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/jobs">
            <Card className="flex items-center gap-6 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex-shrink-0">
                <MessageSquare className="w-8 h-8 text-purple-500" />
              </div>
              <div className="flex-grow text-left">
                <h4 className="text-xl font-semibold text-gray-900 mb-1">
                  {t("prepareInterview")}
                </h4>
                <p className="text-gray-600">
                  {t("prepareInterviewDescription")}
                </p>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/interviewCopilot">
            <Card className="flex items-center gap-6 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-green-500" />
              </div>
              <div className="flex-grow text-left">
                <h4 className="text-xl font-semibold text-gray-900 mb-1">
                  {t("interviewCopilot")}
                </h4>
                <p className="text-gray-600">
                  {t("interviewCopilotDescription")}
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
