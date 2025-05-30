import React from "react";
import { useTranslations } from "next-intl";
import SignInForm from "./SignInForm";
export const CTASection = () => {
  const t = useTranslations("interviewPrepLanding.cta");

  return (
    <section className="w-full py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-6">{t("title")}</h2>
        <p className="text-xl mb-8">{t("description")}</p>
        <SignInForm />
      </div>
    </section>
  );
};
