import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";

export function MockInterviewCompletionComponent() {
  const t = useTranslations("apply.interviews.livekit");
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("processing.title")}</CardTitle>
          <CardDescription>{t("processing.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t("processing.status")}
          </div>
          <div className="flex gap-2 items-center mt-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span className="text-sm">{t("processing.wait")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
