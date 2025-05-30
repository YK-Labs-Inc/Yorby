import { Monitor } from "lucide-react";
import { useTranslations } from "next-intl";

const MobileWarning = () => {
  const t = useTranslations("interviewCopilots.mobileWarning");
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center gap-4 rounded-lg border bg-card text-card-foreground shadow-sm">
      <Monitor className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">{t("title")}</h2>
      <p className="text-muted-foreground">{t("description")}</p>
    </div>
  );
};

export default MobileWarning;
