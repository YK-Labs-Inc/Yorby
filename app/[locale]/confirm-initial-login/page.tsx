"use client";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const ConfirmInitialLogin = () => {
  const user = useUser();
  const hasSentRegistrationEvent = useRef(false);
  const router = useRouter();
  useEffect(() => {
    if (user && !hasSentRegistrationEvent.current) {
      hasSentRegistrationEvent.current = true;
      window.fbq("track", "CompleteRegistration");
      router.push("/onboarding-v2");
    }
  }, [user]);
  return null;
};

export default ConfirmInitialLogin;
