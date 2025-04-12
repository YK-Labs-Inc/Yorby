import React from "react";
import { useTranslations } from "next-intl";

export const FeaturesSection = () => {
  const t = useTranslations("interviewPrepLanding.features");

  return (
    <section className="w-full bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-primary/10">
            <h3 className="text-xl font-semibold mb-3">
              {t("boostConfidence.title")}
            </h3>
            <p className="text-gray-600">{t("boostConfidence.description")}</p>
          </div>
          <div className="p-6 rounded-xl bg-primary/10">
            <h3 className="text-xl font-semibold mb-3">
              {t("rightAnswers.title")}
            </h3>
            <p className="text-gray-600">{t("rightAnswers.description")}</p>
          </div>
          <div className="p-6 rounded-xl bg-primary/10">
            <h3 className="text-xl font-semibold mb-3">
              {t("practice.title")}
            </h3>
            <p className="text-gray-600">{t("practice.description")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
