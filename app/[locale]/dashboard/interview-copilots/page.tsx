import { InterviewCopilotCreationForm } from "./InterviewCopilotCreationForm";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InterviewCopilotsPage() {
  const t = await getTranslations("interviewCopilots");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("createNew.title")}</h1>

      <Card>
        <CardContent className="px-2 py-4">
          <InterviewCopilotCreationForm />
        </CardContent>
      </Card>
    </div>
  );
}
