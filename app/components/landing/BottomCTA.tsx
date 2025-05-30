"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import SignInForm from "@/app/interview-prep-landing/components/SignInForm";

export const BottomCTA = () => {
  const t = useTranslations("LandingPageV5.bottomCTA");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[1080px] mx-auto py-24 px-4 text-center"
    >
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
        {t("title")}
      </h2>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
        {t("description")}
      </p>
      <SignInForm />
    </motion.div>
  );
};
