import React from "react";
import { Upload, Search, MessageSquare, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export const HowItWorks = () => {
  const t = useTranslations("interviewPrepLanding.howItWorks");

  return (
    <section className="w-full bg-gray-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t("title")}
          </h2>
          <p className="text-xl text-gray-600">{t("subtitle")}</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t("steps.upload.title")}
            </h3>
            <p className="text-gray-600">{t("steps.upload.description")}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t("steps.generate.title")}
            </h3>
            <p className="text-gray-600">{t("steps.generate.description")}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t("steps.practice.title")}
            </h3>
            <p className="text-gray-600">{t("steps.practice.description")}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t("steps.improve.title")}
            </h3>
            <p className="text-gray-600">{t("steps.improve.description")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
