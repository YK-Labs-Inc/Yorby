import { useTranslations } from "next-intl";
import { useState } from "react";
import { CoachFeedbackForm } from "./CoachFeedbackForm";
import CoachFeedbackCard from "./CoachFeedbackCard";
import { Button } from "@/components/ui/button";

export default function CoachFeedbackSection({
  submissionId,
  existingFeedback,
  onFeedbackUpdate,
}: {
  submissionId: string;
  existingFeedback: any;
  onFeedbackUpdate?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const t = useTranslations(
    "coachAdminPortal.studentsPage.studentQuestionSubmissions"
  );
  if (deleted) return null;
  return (
    <div className="mt-8">
      {editing ? (
        <CoachFeedbackForm
          submissionId={submissionId}
          existingFeedback={existingFeedback}
          onComplete={() => {
            setEditing(false);
            onFeedbackUpdate?.();
          }}
          onCancel={() => setEditing(false)}
        />
      ) : existingFeedback ? (
        <CoachFeedbackCard
          feedback={existingFeedback}
          onEdit={() => setEditing(true)}
          onDelete={() => {
            setDeleted(true);
            onFeedbackUpdate?.();
          }}
        />
      ) : (
        <Button onClick={() => setEditing(true)}>{t("addFeedback")}</Button>
      )}
    </div>
  );
}
