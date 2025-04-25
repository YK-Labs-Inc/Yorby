"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import SignInForm from "@/app/[locale]/interview-prep-landing/components/SignInForm";
import { useState, useEffect, useRef } from "react";
import {
  X,
  UploadCloud,
  FileText,
  MessagesSquare,
  Sparkles,
  User,
} from "lucide-react";
import { BottomCTA } from "../components/landing/BottomCTA";
import Footer from "../components/landing/Footer";
import OurFeatures from "../components/landing/OurFeatures";

// Add TypeScript declaration for Instagram embed script
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void;
      };
    };
  }
}

// Add TypeScript declaration for TikTok embed script
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void;
      };
    };
    // Add TikTok related types if needed in the future
  }
}

export default function LandingPageV6(props: {
  user: any;
  hasSubscription: boolean;
  credits: number;
  isSubscriptionVariant: boolean;
  isFreemiumEnabled: boolean;
  transformResumeEnabled: boolean;
  enableResumesFileUpload: boolean;
}) {
  return (
    <div className="min-h-screen bg-background">
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
    image: "assets/memories-demo.png",
  },
  {
    id: 2,
    icon: FileText,
    video: "assets/resume-building-demo.mp4",
  },
  {
    id: 3,
    icon: MessagesSquare,
    video: "assets/mock-interview-demo.mp4",
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

      stepRefs.current[activeStepIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });

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
          {activeStep.image && (
            <motion.img
              src={
                activeStep.image.startsWith("assets/")
                  ? `/${activeStep.image}`
                  : activeStep.image
              }
              alt={`${t(`steps.${activeStep.id}.title`)} illustration`}
              className="w-full h-full object-contain cursor-pointer hover:cursor-zoom-in"
              onClick={() =>
                handleImageClick(
                  activeStep.image.startsWith("assets/")
                    ? `/${activeStep.image}`
                    : activeStep.image
                )
              }
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
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

// Instagram Embed Component
const InstagramEmbed = ({ url }: { url: string }) => {
  useEffect(() => {
    // Check if Instagram embed script is already loaded
    if (!window.instgrm) {
      // Create script element for Instagram embed
      const script = document.createElement("script");
      script.src = "//www.instagram.com/embed.js";
      script.async = true;

      // Append script to document body
      document.body.appendChild(script);

      return () => {
        // Cleanup function to remove script if component unmounts before script loads
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    } else {
      // If script is already loaded, process embeds
      if (window.instgrm && window.instgrm.Embeds) {
        window.instgrm.Embeds.process();
      }
    }
  }, [url]);

  return (
    <blockquote
      className="instagram-media"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
      style={{
        background: "#FFF",
        border: 0,
        borderRadius: "3px",
        boxShadow: "0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)",
        margin: "1px",
        maxWidth: "540px",
        minWidth: "326px",
        padding: 0,
        width: "99.375%",
      }}
    >
      <div style={{ padding: "16px" }}>
        <a
          href={url}
          style={{
            background: "#FFFFFF",
            lineHeight: 0,
            padding: "0 0",
            textAlign: "center",
            textDecoration: "none",
            width: "100%",
          }}
          target="_blank"
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "#F4F4F4",
                borderRadius: "50%",
                flexGrow: 0,
                height: "40px",
                marginRight: "14px",
                width: "40px",
              }}
            ></div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  backgroundColor: "#F4F4F4",
                  borderRadius: "4px",
                  flexGrow: 0,
                  height: "14px",
                  marginBottom: "6px",
                  width: "100px",
                }}
              ></div>
              <div
                style={{
                  backgroundColor: "#F4F4F4",
                  borderRadius: "4px",
                  flexGrow: 0,
                  height: "14px",
                  width: "60px",
                }}
              ></div>
            </div>
          </div>
          <div style={{ padding: "19% 0" }}></div>
          <div
            style={{
              display: "block",
              height: "50px",
              margin: "0 auto 12px",
              width: "50px",
            }}
          >
            <svg
              width="50px"
              height="50px"
              viewBox="0 0 60 60"
              version="1.1"
              xmlns="https://www.w3.org/2000/svg"
              xmlnsXlink="https://www.w3.org/1999/xlink"
            >
              <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <g
                  transform="translate(-511.000000, -20.000000)"
                  fill="#000000"
                >
                  <g>
                    <path d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631"></path>
                  </g>
                </g>
              </g>
            </svg>
          </div>
          <div style={{ paddingTop: "8px" }}>
            <div
              style={{
                color: "#3897f0",
                fontFamily: "Arial,sans-serif",
                fontSize: "14px",
                fontStyle: "normal",
                fontWeight: 550,
                lineHeight: "18px",
              }}
            >
              View this post on Instagram
            </div>
          </div>
          <div style={{ padding: "12.5% 0" }}></div>
        </a>
      </div>
    </blockquote>
  );
};

// TikTok Embed Component
const TikTokEmbed = ({ videoId }: { videoId: string }) => {
  useEffect(() => {
    // Create script element for TikTok embed
    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;

    // Append script to document body
    document.body.appendChild(script);

    // Clean up on unmount
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [videoId]);

  return (
    <blockquote
      className="tiktok-embed"
      cite={`https://www.tiktok.com/@perfectinterview.ai/video/${videoId}`}
      data-video-id={videoId}
      style={{ maxWidth: "605px", minWidth: "325px" }}
    >
      <section>
        <a
          target="_blank"
          title="@perfectinterview.ai"
          href="https://www.tiktok.com/@perfectinterview.ai?refer=embed"
        >
          @perfectinterview.ai
        </a>
      </section>
    </blockquote>
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
          <InstagramEmbed url="https://www.instagram.com/reel/DIbu841BIKf/?utm_source=ig_embed&utm_campaign=loading" />
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
          <InstagramEmbed url="https://www.instagram.com/reel/DG3kNHty8CV/?utm_source=ig_embed&utm_campaign=loading" />
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
          <TikTokEmbed videoId="7467285454807682350" />
        </motion.div>
      </div>
    </div>
  );
};
