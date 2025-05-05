"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import SignInForm from "@/app/[locale]/interview-prep-landing/components/SignInForm";
import { useState, useEffect, useRef } from "react";
import { X, FileText, MessagesSquare, Sparkles, User } from "lucide-react";
import { BottomCTA } from "../components/landing/BottomCTA";
import Footer from "../components/landing/Footer";
import OurFeatures from "../components/landing/OurFeatures";
import { InstagramEmbed, TikTokEmbed } from "react-social-media-embed";

export default function LandingPageV6() {
  return (
    <div className="min-h-screen bg-background pr-4">
      <LandingHero />
      <HowItWorksSection />
      <SocialMediaSection />
      <OurFeatures />
      <BottomCTA />
      <Footer />
    </div>
  );
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const LandingHero = () => {
  const t = useTranslations("landingPageV6.hero");

  return (
    <div className="w-full max-w-[1080px] mx-auto px-4 pt-16 pb-8 flex flex-col items-center text-center">
      <motion.h1
        className="text-5xl md:text-6xl font-bold tracking-tight"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5 }}
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
        className="flex flex-col sm:flex-row gap-4 mt-4"
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
        {t("trustedBy")}
      </motion.p>
    </div>
  );
};

const steps = [
  {
    id: 1,
    icon: User,
    video: "assets/memories-demo.mp4",
  },
  {
    id: 2,
    icon: FileText,
    video: "assets/resume-building-demo.mp4",
  },
  {
    id: 3,
    icon: MessagesSquare,
    video: "assets/interview-prep-demo.mp4",
  },
  {
    id: 4,
    icon: Sparkles,
    video: "assets/interview-copilot-demo.mp4",
  },
];

// Simple throttle implementation
function simpleThrottle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
) {
  let inThrottle: boolean;
  let lastFunc: NodeJS.Timeout | null = null;
  let lastRan: number;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

const HowItWorksSection = () => {
  const t = useTranslations("landingPageV6.howItWorks");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImageSrc, setZoomedImageSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isProgrammaticScroll = useRef(false);
  const programmaticScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const goToNextStep = () => {
    setActiveStepIndex((prevIndex) => (prevIndex + 1) % steps.length);
  };

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    intervalRef.current = null;
    progressIntervalRef.current = null;

    setProgress(0);

    intervalRef.current = setInterval(goToNextStep, 10000);

    const stepDuration = 10000;
    const updateInterval = 100;
    const increment = (updateInterval / stepDuration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prevProgress) => {
        const nextProgress = prevProgress + increment;
        if (nextProgress >= 100) {
          if (progressIntervalRef.current)
            clearInterval(progressIntervalRef.current);
          return 100;
        }
        return nextProgress;
      });
    }, updateInterval);
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    let handleTimeUpdate: (() => void) | null = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    const currentStep = steps[activeStepIndex];
    setProgress(0);

    if (scrollContainerRef.current && stepRefs.current[activeStepIndex]) {
      isProgrammaticScroll.current = true;
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
      }

      // Center the active step horizontally in the scroll container
      const container = scrollContainerRef.current;
      const stepEl = stepRefs.current[activeStepIndex];
      if (container && stepEl) {
        const scrollLeft =
          stepEl.offsetLeft -
          container.offsetLeft -
          container.clientWidth / 2 +
          stepEl.clientWidth / 2;
        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }

      programmaticScrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 800);
    }

    if (currentStep?.video && videoElement) {
      handleTimeUpdate = () => {
        if (videoElement && videoElement.duration) {
          const currentProgress =
            (videoElement.currentTime / videoElement.duration) * 100;
          setProgress(currentProgress);
        }
      };
      videoElement.onended = goToNextStep;
      videoElement.addEventListener("timeupdate", handleTimeUpdate);
      videoElement.load();
      videoElement.play().catch((error) => {
        console.error("Video play failed on step change:", error);
      });
    } else {
      startTimer();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
      }
      if (videoElement) {
        videoElement.onended = null;
        if (handleTimeUpdate) {
          videoElement.removeEventListener("timeupdate", handleTimeUpdate);
        }
      }
    };
  }, [activeStepIndex]);

  // Scroll handler using simpleThrottle
  const handleScroll = useRef(
    simpleThrottle(() => {
      if (!scrollContainerRef.current || isProgrammaticScroll.current) return;

      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      // Calculate the horizontal center of the container's viewport
      const containerCenter = scrollLeft + container.clientWidth / 2;

      let closestIndex = 0;
      let minDistance = Infinity;

      stepRefs.current.forEach((stepEl, index) => {
        if (!stepEl) return;

        // Calculate step's center relative to the container's scrollable area
        const stepLeftRelativeToContainer =
          stepEl.offsetLeft - container.offsetLeft;
        const stepCenter = stepLeftRelativeToContainer + stepEl.offsetWidth / 2;

        // Find distance between container center and step center
        const distance = Math.abs(stepCenter - containerCenter);

        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      // Check bounds and if index actually changed
      if (
        closestIndex >= 0 &&
        closestIndex < steps.length &&
        closestIndex !== activeStepIndex
      ) {
        isProgrammaticScroll.current = true;
        setActiveStepIndex(closestIndex);
        if (programmaticScrollTimeoutRef.current)
          clearTimeout(programmaticScrollTimeoutRef.current);
        programmaticScrollTimeoutRef.current = setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 100);
      }
    }, 200)
  ).current;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  const handleStepClick = (index: number) => {
    if (index !== activeStepIndex) {
      setActiveStepIndex(index);
    }
  };

  const handleImageClick = (src: string) => {
    setZoomedImageSrc(src);
    setIsZoomed(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (steps[activeStepIndex]?.video && videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleCloseZoom = () => {
    setIsZoomed(false);
    setZoomedImageSrc(null);
    const currentStep = steps[activeStepIndex];
    if (currentStep?.video && videoRef.current) {
      videoRef.current
        .play()
        .catch((e) => console.error("Error resuming video:", e));
    } else {
      startTimer();
    }
  };

  const activeStep = steps[activeStepIndex];

  return (
    <div className="w-full max-w-[1080px] mx-auto px-4 py-16">
      <motion.h2
        className="text-3xl md:text-4xl font-bold text-center mb-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        {t("title")}
      </motion.h2>

      <div className="flex flex-col md:flex-row gap-8 md:items-start">
        <motion.div
          key={activeStepIndex}
          className="md:w-1/2 h-96 md:h-[600px] w-full overflow-hidden rounded-lg shadow-lg bg-muted flex items-center justify-center border border-border order-1 md:order-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {activeStep.video && (
            <video
              ref={videoRef}
              key={activeStep.video}
              className="w-full h-full object-contain"
              src={
                activeStep.video.startsWith("assets/")
                  ? `/${activeStep.video}`
                  : activeStep.video
              }
              autoPlay
              muted
              playsInline
              controls
            />
          )}
        </motion.div>

        <motion.div
          ref={scrollContainerRef}
          className="md:w-1/2 flex flex-row overflow-x-auto snap-x snap-mandatory py-4 px-4 md:px-0 md:flex-col md:gap-4 md:py-0 md:overflow-x-visible md:snap-none order-2 md:order-1"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {steps.map((step, index) => {
            const isActive = index === activeStepIndex;
            return (
              <div
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
                key={step.id}
                className={`w-11/12 flex-shrink-0 snap-start flex flex-col items-start p-4 md:flex-row md:items-center md:p-3 md:pl-8 md:w-auto md:snap-none md:relative cursor-pointer rounded-lg transition-colors duration-300 ${isActive ? "" : "hover:bg-muted/50"}`}
                onClick={() => handleStepClick(index)}
              >
                <div className="hidden md:block absolute left-6 top-0 bottom-0 w-1 bg-muted rounded-full">
                  <motion.div
                    className="absolute top-0 left-0 w-full bg-primary rounded-full"
                    initial={{ height: "0%" }}
                    animate={{ height: isActive ? `${progress}%` : "0%" }}
                    transition={{ duration: 0.1, ease: "linear" }}
                  />
                </div>

                <div className="relative pt-3 w-full md:pt-0 md:text-left">
                  <motion.div
                    className="md:hidden absolute top-0 left-0 h-1 bg-primary rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: isActive ? `${progress}%` : "0%" }}
                    transition={{ duration: 0.1, ease: "linear" }}
                  />

                  <h4 className="text-base font-semibold mb-1">
                    {t(`steps.${step.id}.title`)}
                  </h4>
                  <div
                    className={`text-sm transition-colors duration-300 ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {t
                      .raw(`steps.${step.id}.description`)
                      .map((line: string, lineIndex: number) => (
                        <span key={lineIndex} className="block mb-1">
                          {line}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {isZoomed && zoomedImageSrc && (
        <motion.div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCloseZoom}
        >
          <motion.div
            className="relative"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomedImageSrc}
              alt="Zoomed view"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-xl"
            />
            <button
              onClick={handleCloseZoom}
              className="absolute top-2 right-2 bg-white/50 hover:bg-white/80 text-black rounded-full p-1.5 transition-colors"
              aria-label="Close zoomed image"
            >
              <X size={20} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

const SocialMediaSection = () => {
  const t = useTranslations("landingPageV6.socialMedia");

  return (
    <div className="w-full max-w-[1080px] mx-auto px-4 py-16">
      <motion.div
        className="text-center mb-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
        <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* First Instagram Post */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full overflow-hidden flex justify-center"
        >
          <div style={{ width: "100%", maxWidth: "540px" }}>
            <InstagramEmbed
              url="https://www.instagram.com/reel/DIbu841BIKf/"
              width="100%"
            />
          </div>
        </motion.div>

        {/* Second Instagram Post */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full overflow-hidden flex justify-center"
        >
          <div style={{ width: "100%", maxWidth: "540px" }}>
            <InstagramEmbed
              url="https://www.instagram.com/reel/DG3kNHty8CV/"
              width="100%"
            />
          </div>
        </motion.div>

        {/* TikTok Post */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="w-full overflow-hidden flex justify-center"
        >
          <div style={{ width: "100%", maxWidth: "325px" }}>
            <TikTokEmbed
              url="https://www.tiktok.com/@perfectinterview.ai/video/7467285454807682350"
              width="100%"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
