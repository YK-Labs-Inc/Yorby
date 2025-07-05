"use client";

import { Tables } from "@/utils/supabase/database.types";
import { createContext, useContext, ReactNode } from "react";

interface OnboardingState {
  first_custom_job_created: boolean;
  first_answer_generated: boolean;
  first_question_answered: boolean;
  first_mock_interview_completed: boolean;
  connected_account_to_email: boolean;
  last_created_job_id: string | null;
  last_unanswered_question_id: string | null;
}

interface OnboardingContextType {
  onboardingState: OnboardingState | null;
  isOnboardingComplete: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: ReactNode;
  initialState: OnboardingState | null;
}

export function OnboardingProvider({
  children,
  initialState,
}: OnboardingProviderProps) {
  const isOnboardingComplete = initialState
    ? initialState.first_custom_job_created &&
      initialState.first_answer_generated &&
      initialState.first_question_answered &&
      initialState.first_mock_interview_completed &&
      initialState.connected_account_to_email
    : false;

  return (
    <OnboardingContext.Provider
      value={{
        onboardingState: initialState,
        isOnboardingComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
