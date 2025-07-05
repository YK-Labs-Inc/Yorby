"use client";

import { useEffect, useState } from "react";

export default function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateScrollProgress = () => {
      // Calculate how much we can scroll in total
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      // Calculate how far we've scrolled
      const scrollPosition = window.scrollY;
      // Convert to percentage
      const progress = (scrollPosition / totalHeight) * 100;
      setScrollProgress(progress);
      setIsVisible(scrollPosition > 100); // Show after scrolling 100px
    };

    // Add scroll event listener
    window.addEventListener("scroll", updateScrollProgress);
    // Initial calculation
    updateScrollProgress();

    // Cleanup
    return () => window.removeEventListener("scroll", updateScrollProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      {/* Progress bar */}
      <div className="h-1 bg-gray-100/50 backdrop-blur-sm">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Percentage indicator */}
      <div
        className={`fixed right-8 bottom-8 bg-white shadow-lg rounded-full p-3 transform transition-all duration-300 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="relative w-10 h-10">
          <svg className="transform -rotate-90 w-10 h-10">
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-blue-600"
              strokeDasharray={`${scrollProgress * 1.005}, 100`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-900">
            {Math.round(scrollProgress)}%
          </span>
        </div>
      </div>
    </div>
  );
}
