import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("auth.error");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {params?.error ? (
          <p className="text-sm text-muted-foreground">
            {t("codeError")} {params.error}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("unspecifiedError")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
