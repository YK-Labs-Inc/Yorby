"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

const videoKeys = [
  {
    title: "purchase.productVideoCarousel.resumeBuilder.title",
    description: "purchase.productVideoCarousel.resumeBuilder.description",
    src: "/assets/resume-building-demo.mp4",
  },
  {
    title: "purchase.productVideoCarousel.practiceQuestions.title",
    description: "purchase.productVideoCarousel.practiceQuestions.description",
    src: "/assets/interview-prep-demo.mp4",
  },
  {
    title: "purchase.productVideoCarousel.copilot.title",
    description: "purchase.productVideoCarousel.copilot.description",
    src: "/assets/interview-copilot-demo.mp4",
  },
];

export default function ProductVideoCarousel() {
  const [active, setActive] = useState(0);
  const t = useTranslations();
  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold text-center mb-6">
        {t("purchase.productVideoCarousel.heading")}
      </h3>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
          {videoKeys.map((v, i) => (
            <button
              key={v.src}
              onClick={() => setActive(i)}
              className={`flex flex-col items-center px-4 py-2 rounded-lg border transition-all duration-200 min-w-[200px] ${
                i === active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              }`}
            >
              <span className="font-semibold text-base mb-1">{t(v.title)}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {t(v.description)}
              </span>
            </button>
          ))}
        </div>
        <div className="w-full max-w-2xl overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <video
            key={videoKeys[active].src}
            src={videoKeys[active].src}
            controls
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain bg-black"
          />
        </div>
      </div>
    </div>
  );
}
