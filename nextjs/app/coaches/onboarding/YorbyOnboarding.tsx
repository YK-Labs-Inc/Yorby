"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { updateUserDisplayName } from "@/app/onboarding-v2/actions";
import { H1 } from "@/components/typography";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

export default function YorbyOnboarding({
  redirectTo,
}: {
  redirectTo: string;
}) {
  const [displayName, setDisplayName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const t = useTranslations("yorbyOnboarding");
  const { logError } = useAxiomLogging();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError(t("nameRequired"));
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateUserDisplayName(displayName.trim());
      if (result.error) {
        setError(result.error);
        setIsUpdating(false);
        return;
      }

      // Redirect to coach admin programs page instead of the original redirect
      router.push(redirectTo);
    } catch (error) {
      logError("Error updating display name", { error });
      setError(t("updateError"));
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <H1 className="text-3xl font-bold mb-2">{t("title")}</H1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium mb-2"
                >
                  {t("nameLabel")}
                </label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder={t("namePlaceholder")}
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setError("");
                  }}
                  className="w-full"
                  disabled={isUpdating}
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-destructive">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  t("continue")
                )}
              </Button>
            </form>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("privacyNote")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
