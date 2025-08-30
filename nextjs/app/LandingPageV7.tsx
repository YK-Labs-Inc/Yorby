"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Sparkles,
  Target,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Users,
  Briefcase,
  Brain,
  CheckCircle,
  Star,
  Zap,
  Trophy,
} from "lucide-react";
import { BottomCTA } from "@/app/components/landing/BottomCTA";
import Footer from "@/app/components/landing/Footer";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const AnimatedCounter = ({
  end,
  suffix = "",
}: {
  end: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = end / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [hasStarted, end]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

export default function LandingPageV7() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHero />
      <TrustMetrics />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <BottomCTA />
      <Footer />
    </div>
  );
}

const LandingHero = () => {
  const t = useTranslations("landingPageV7.hero");

  return (
    <div className="w-full max-w-[1080px] mx-auto px-4 pt-20 pb-16 flex flex-col items-center text-center">
      <motion.div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        <Zap className="w-4 h-4" />
        <span>{t("tagline")}</span>
      </motion.div>

      <motion.h1
        className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {t("title")}
      </motion.h1>

      <motion.p
        className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-3xl"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {t("subtitle")}
      </motion.p>

      <motion.div
        className="flex flex-col sm:flex-row gap-4 mt-8"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Link href="/sign-in">
          <Button size="lg" className="min-w-[200px] text-lg">
            {t("getStarted")}
            <Sparkles className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </motion.div>

      <motion.p
        className="mt-4 text-sm text-muted-foreground"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {t("noCreditCard")}
      </motion.p>
    </div>
  );
};

const TrustMetrics = () => {
  const t = useTranslations("landingPageV7.trustMetrics");
  const metrics = [
    { number: 10000, suffix: "+", label: t("candidatesPrepared"), icon: Users },
    { number: 30000, suffix: "+", label: t("jobsAnalyzed"), icon: Briefcase },
    {
      number: 100000,
      suffix: "+",
      label: t("questionsGenerated"),
      icon: Brain,
    },
  ];

  return (
    <div className="w-full bg-muted/30 py-12">
      <div className="max-w-[1080px] mx-auto px-4">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              className="flex flex-col items-center text-center"
            >
              <metric.icon className="w-8 h-8 mb-3 text-primary" />
              <div className="text-3xl font-bold">
                <AnimatedCounter end={metric.number} suffix={metric.suffix} />
              </div>
              <div className="text-muted-foreground mt-1">{metric.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

const HowItWorksSection = () => {
  const t = useTranslations("landingPageV7.howItWorks");
  const [activeStep, setActiveStep] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const steps = [
    {
      id: 1,
      icon: Target,
      title: t("steps.1.title"),
      description: t("steps.1.description"),
      media: "/assets/interview-prep-creation-demo.png",
    },
    {
      id: 2,
      icon: BookOpen,
      title: t("steps.2.title"),
      description: t("steps.2.description"),
      media: "assets/interview-questions-demo.png",
    },
    {
      id: 3,
      icon: MessageSquare,
      title: t("steps.3.title"),
      description: t("steps.3.description"),
      media: "assets/mock-interview-demo.png",
    },
    {
      id: 4,
      icon: TrendingUp,
      title: t("steps.4.title"),
      description: t("steps.4.description"),
      media: "assets/interview-feedback.png",
    },
  ];

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleStepClick = (index: number) => {
    if (index !== activeStep) {
      setActiveStep(index);
      startTimer(); // Reset the timer when user clicks a different step
    }
  };

  // Helper function to determine if media is video
  const isVideo = (media: string) => {
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov"];
    return videoExtensions.some((ext) => media.toLowerCase().endsWith(ext));
  };

  return (
    <div className="w-full max-w-[1080px] mx-auto px-4 py-20">
      <motion.div
        className="text-center mb-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeIn}
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-4">{t("title")}</h2>
        <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          className="space-y-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              variants={fadeIn}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                index === activeStep
                  ? "bg-primary/10 border-2 border-primary"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => handleStepClick(index)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    index === activeStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          key={activeStep}
          className="relative h-[400px] rounded-xl overflow-hidden bg-muted"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {isVideo(steps[activeStep].media) ? (
            <video
              src={steps[activeStep].media}
              className="w-full h-full object-contain"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={steps[activeStep].media}
              alt={steps[activeStep].title}
              className="w-full h-full object-contain"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-6">
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-2">Step {activeStep + 1}</h3>
              <p className="text-white/90">{steps[activeStep].title}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const FeaturesSection = () => {
  const t = useTranslations("landingPageV7.features");
  const features = [
    {
      icon: Brain,
      title: t("personalizedToYou.title"),
      description: t("personalizedToYou.description"),
    },
    {
      icon: Zap,
      title: t("unlimitedPractice.title"),
      description: t("unlimitedPractice.description"),
    },
    {
      icon: MessageSquare,
      title: t("naturalConversations.title"),
      description: t("naturalConversations.description"),
    },
    {
      icon: Trophy,
      title: t("detailedFeedback.title"),
      description: t("detailedFeedback.description"),
    },
    {
      icon: Target,
      title: t("jobSpecificPrep.title"),
      description: t("jobSpecificPrep.description"),
    },
    {
      icon: CheckCircle,
      title: t("trackProgress.title"),
      description: t("trackProgress.description"),
    },
  ];

  return (
    <div className="w-full py-20 bg-muted/30">
      <div className="max-w-[1080px] mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{t("title")}</h2>
          <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              className="p-6 rounded-xl bg-background border hover:shadow-lg transition-shadow"
            >
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

const TestimonialsSection = () => {
  const t = useTranslations("landingPageV7.testimonials");
  const testimonials = [
    {
      name: t("sarah.name"),
      role: t("sarah.role"),
      content: t("sarah.content"),
      rating: 5,
    },
    {
      name: t("michael.name"),
      role: t("michael.role"),
      content: t("michael.content"),
      rating: 5,
    },
    {
      name: t("emily.name"),
      role: t("emily.role"),
      content: t("emily.content"),
      rating: 5,
    },
  ];

  return (
    <div className="w-full py-20">
      <div className="max-w-[1080px] mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{t("title")}</h2>
          <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              className="p-6 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-lg mb-4 italic">"{testimonial.content}"</p>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">
                  {testimonial.role}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="text-center mt-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
          transition={{ delay: 0.4 }}
        >
          <Link href="/sign-in">
            <Button size="lg" className="min-w-[200px] text-lg">
              {t("joinThemToday")}
              <Sparkles className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
