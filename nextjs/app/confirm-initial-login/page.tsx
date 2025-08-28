"use client";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useEffect, useRef } from "react";

const ConfirmInitialLogin = () => {
  const user = useUser();
  const hasSentRegistrationEvent = useRef(false);
  const router = useRouter();
  const posthog = usePostHog();
  useEffect(() => {
    if (posthog && user && !hasSentRegistrationEvent.current) {
      hasSentRegistrationEvent.current = true;
      window.fbq("track", "CompleteRegistration");
      posthog.capture("CompleteRegistration_ph", {
        userId: user.id,
      });
      router.push(
        user.app_metadata.completed_candidate_onboarding
          ? "/dashboard/jobs?newJob=true"
          : "/onboarding"
      );
    }
  }, [posthog, user]);
  return null;
};

export default ConfirmInitialLogin;
