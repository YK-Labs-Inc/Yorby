import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Sparkles, Trash2 } from "lucide-react";
import React from "react";
import { Tables } from "@/utils/supabase/database.types";
import { deleteCoachFeedback } from "./actions";

export default function CoachFeedbackCard({
  feedback,
  onEdit,
  onDelete,
}: {
  feedback: Tables<"custom_job_question_submission_feedback">;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations(
    "coachAdminPortal.studentsPage.studentQuestionSubmissions"
  );
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <Card className="mt-8 border-4 border-yellow-400 bg-yellow-50/80 shadow-xl relative overflow-visible">
      <div className="absolute -top-5 left-6 flex items-center gap-2 z-10">
        <div
          className="flex items-center bg-yellow-300 text-yellow-900 font-bold px-3 py-1 rounded-full shadow border-2 border-yellow-400 text-sm"
          title={t("coachFeedback")}
          aria-label={t("coachFeedback")}
        >
          <Sparkles
            className="w-4 h-4 mr-1 text-yellow-700"
            fill="currentColor"
          />
          {t("coachFeedback")}
        </div>
      </div>
      <CardHeader className="flex flex-row items-center justify-end pt-8 pb-2">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            title={t("editFeedback")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title={t("deleteDialogTitle")}
                onClick={() => setOpen(true)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteDialogTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteDialogDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && (
                <div className="text-destructive text-sm mb-2">{error}</div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>
                  {t("deleteDialogCancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    const formData = new FormData();
                    formData.append("feedbackId", feedback.id);
                    const res = await deleteCoachFeedback(formData);
                    setLoading(false);
                    if (res?.error) {
                      setError(t("deleteDialogError"));
                    } else {
                      setOpen(false);
                      if (onDelete) onDelete();
                    }
                  }}
                >
                  {t("deleteDialogConfirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg bg-white/80 dark:bg-yellow-100/10 p-6 overflow-y-auto border border-yellow-200 max-h-[400px] relative shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles
                className="w-5 h-5 text-yellow-500"
                fill="currentColor"
              />
              <h3 className="font-semibold text-lg text-yellow-900">
                {t("strengths")}
              </h3>
            </div>
            <div className="space-y-3">
              {feedback.pros.length === 0 ? (
                <p className="text-yellow-800 italic">{t("noStrengths")}</p>
              ) : (
                feedback.pros.map((pro: string, idx: number) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <span className="text-yellow-600 mt-1">•</span>
                    <p className="text-yellow-900">{pro}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-lg bg-white/80 dark:bg-yellow-100/10 p-6 overflow-y-auto border border-yellow-200 max-h-[400px] relative shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles
                className="w-5 h-5 text-yellow-500"
                fill="currentColor"
              />
              <h3 className="font-semibold text-lg text-yellow-900">
                {t("areasForImprovement")}
              </h3>
            </div>
            <div className="space-y-3">
              {feedback.cons.length === 0 ? (
                <p className="text-yellow-800 italic">
                  {t("noAreasForImprovement")}
                </p>
              ) : (
                feedback.cons.map((con: string, idx: number) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <span className="text-yellow-600 mt-1">•</span>
                    <p className="text-yellow-900">{con}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
