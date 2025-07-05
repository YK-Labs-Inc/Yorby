import React from "react";
import { useTranslations } from "next-intl";
import SignInForm from "./SignInForm";

export const HeroSection = () => {
  const t = useTranslations("interviewPrepLanding.hero");

  return (
    <section className="w-full py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            {t("title")}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t("description")}
          </p>
          <div className="flex flex-col items-center gap-4">
            <SignInForm />
            <p className="text-sm text-gray-500/80">{t("trustedBy")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
