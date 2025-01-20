"use client";

import JobCreationComponent from "./JobCreationComponent";
import { useTranslations } from "next-intl";
import FeatureHighlight from "./components/FeatureHighlight";
import Typewriter from "@/components/typewriter/react";

export default function LandingPageV2() {
  const t = useTranslations("landingPage");
  return (
    <div className="flex flex-col justify-center min-h-screen w-full mt-8 p-4">
      <div className="text-left mb-4">
        <h1 className="text-7xl font-bold tracking-tight">
          <span>{t("title")} </span>
          <span className="text-primary">
            <Typewriter
              // @ts-ignore
              onInit={(typewriter) => {
                typewriter
                  .typeString(t("job1"))
                  .pauseFor(700)
                  .deleteAll()
                  .typeString(t("job2"))
                  .pauseFor(700)
                  .deleteAll()
                  .typeString(t("job3"))
                  .pauseFor(700)
                  .deleteAll()
                  .typeString(t("everyone"))
                  .start();
              }}
            />
          </span>
        </h1>
      </div>

      {/* <div className="relative w-full border-2 border-gray-300 rounded-lg p-4 shadow-lg"> */}
      {/* Job Description Arrow
        <div className="absolute -top-10 right-[5%]">
          <p className="text-3xl text-[#333333] italic transform rotate-[5deg] mb-2">
            {t("enterJobDescription")}
          </p>
          <RedoIcon className="absolute right-[15%] w-24 h-24 text-red-500 rotate-[130deg] z-10" />
        </div> */}
      {/* <JobCreationComponent /> */}
      {/* </div> */}
      <FeatureHighlight />
      <div className="relative w-full border-2 border-gray-300 rounded-lg p-4 shadow-lg">
        <JobCreationComponent />
      </div>
    </div>
  );
}
