import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import SignInForm from "@/app/[locale]/interview-prep-landing/components/SignInForm";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const LandingHero = () => {
  const t = useTranslations("LandingPageV5.hero");

  return (
    <div className="w-full max-w-[1080px] mx-auto px-4 pt-16 pb-8 flex flex-col items-center text-center">
      <motion.h1
        className="text-5xl md:text-6xl font-bold tracking-tight"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        {t("titleV2")}
      </motion.h1>

      <motion.p
        className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-3xl"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {t("descriptionV2")}
      </motion.p>

      <motion.div
        className="flex flex-col sm:flex-row gap-4 mt-8"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <SignInForm />
      </motion.div>

      <motion.p
        className="mt-2 text-muted-foreground"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {t("trustBadge", { userCount: "3,000+" })}
      </motion.p>
    </div>
  );
};
