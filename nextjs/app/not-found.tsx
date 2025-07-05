import { useTranslations } from "next-intl";

const NotFound = () => {
  const t = useTranslations("notFoundPage");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
      <p className="text-lg text-muted-foreground mb-8">{t("message")}</p>
      <a href="/" className="text-primary underline">
        {t("goHomeLink")}
      </a>
    </div>
  );
};

export default NotFound;
