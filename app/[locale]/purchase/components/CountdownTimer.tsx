"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

function getTimeLeft(targetDate: Date) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { hours, minutes, seconds };
}

export default function CountdownTimer() {
  // Fake: 24 hours from now
  const [targetDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    return d;
  });
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate));
  const t = useTranslations();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex justify-center mt-4">
      <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-6 py-2 rounded-full font-semibold text-base shadow-sm border border-yellow-200 dark:border-yellow-700 animate-pulse">
        {t("purchase.countdownTimer.offerEnds")}{" "}
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </div>
    </div>
  );
}
