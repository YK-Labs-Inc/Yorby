"use client";

import PracticeQuestions from "./PracticeQuestions";
import QuestionsLoading from "./QuestionsLoading";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PracticeQuestionsClientWrapper({
  jobId,
  questions,
  isLocked,
  userCredits,
  currentPage,
  numFreeQuestions = 1,
  isSubscriptionVariant,
  isMultiTenantExperience,
}: {
  jobId: string;
  questions: any[];
  isLocked: boolean;
  userCredits: number;
  currentPage: number;
  numFreeQuestions?: number;
  isSubscriptionVariant: boolean;
  isMultiTenantExperience: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(
    Array.from(searchParams?.entries?.() ?? []).map(([k, v]) => [
      k,
      Array.isArray(v) ? v[0] : v,
    ])
  );

  const getParam = (key: string, defaultValue: string) => {
    const value = params.get(key);
    return value === null ? defaultValue : value;
  };

  const sortOrder = getParam("sort", "desc") as "asc" | "desc";
  const showAnswered = getParam("answered", "1") !== "0";
  const showUnanswered = getParam("unanswered", "1") !== "0";
  const showAIGenerated = getParam("ai_generated", "1") !== "0";
  const showUserGenerated = getParam("user_generated", "1") !== "0";

  const setParam = (key: string, value: string | undefined) => {
    if (value === undefined || value === "1") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [questions]);

  const updateParams = () => {
    setIsLoading(true);
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  return isLoading ? (
    <QuestionsLoading />
  ) : (
    <PracticeQuestions
      jobId={jobId}
      questions={questions}
      isLocked={isLocked}
      userCredits={userCredits}
      currentPage={currentPage}
      numFreeQuestions={numFreeQuestions}
      isSubscriptionVariant={isSubscriptionVariant}
      sortOrder={sortOrder}
      showAnswered={showAnswered}
      showUnanswered={showUnanswered}
      showAIGenerated={showAIGenerated}
      showUserGenerated={showUserGenerated}
      onToggleAnswered={() => {
        setParam("answered", showAnswered ? "0" : undefined);
        updateParams();
      }}
      onToggleUnanswered={() => {
        setParam("unanswered", showUnanswered ? "0" : undefined);
        updateParams();
      }}
      onToggleAIGenerated={() => {
        setParam("ai_generated", showAIGenerated ? "0" : undefined);
        updateParams();
      }}
      onToggleUserGenerated={() => {
        setParam("user_generated", showUserGenerated ? "0" : undefined);
        updateParams();
      }}
      onSortOrderChange={(value) => {
        setParam("sort", value);
        updateParams();
      }}
      isMultiTenantExperience={isMultiTenantExperience}
    />
  );
}
