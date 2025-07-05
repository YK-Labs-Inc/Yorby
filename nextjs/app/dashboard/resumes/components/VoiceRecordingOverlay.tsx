"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { X, Check } from "lucide-react";

interface VoiceRecordingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  audioDevices?: { deviceId: string; label: string }[];
  selectedAudio?: string;
  onSelectAudio?: (deviceId: string) => void;
}

export default function VoiceRecordingOverlay({
  isOpen,
  onClose,
  onConfirm,
  audioDevices = [],
  selectedAudio = "",
  onSelectAudio,
}: VoiceRecordingOverlayProps) {
  const t = useTranslations("resumeBuilder");
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformAmplitudes, setWaveformAmplitudes] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer when recording starts
  useEffect(() => {
    if (isOpen) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Initialize waveform with random values
      const initialAmplitudes = Array.from(
        { length: 40 },
        () => Math.random() * 8 + 1
      );
      setWaveformAmplitudes(initialAmplitudes);

      // Animate waveform
      waveformRef.current = setInterval(() => {
        setWaveformAmplitudes((prevAmplitudes) =>
          prevAmplitudes.map(() => Math.random() * 8 + 1)
        );
      }, 150);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (waveformRef.current) {
        clearInterval(waveformRef.current);
        waveformRef.current = null;
      }
    }

    // Clean up timers on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (waveformRef.current) {
        clearInterval(waveformRef.current);
        waveformRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full p-4 rounded-lg border dark:bg-gray-800 dark:border-gray-700 bg-gray-50 shadow-sm flex flex-col space-y-4">
      <div className="flex items-center">
        {/* Left side - Cancel button */}
        <button
          onClick={onClose}
          className="h-12 w-12 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center flex-shrink-0 transition-colors"
          aria-label={t("cancel") || "Cancel"}
        >
          <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Middle - Waveform visualization */}
        <div className="flex-1 mx-4 flex items-center">
          <div className="w-full relative">
            {/* Waveform bars */}
            <div className="flex items-center justify-between h-8">
              {waveformAmplitudes.map((amplitude, index) => (
                <div
                  key={index}
                  className="w-[2px] bg-gray-500 dark:bg-gray-400 rounded-full transition-all duration-150"
                  style={{
                    height: `${amplitude * 2}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right side with timer and confirm button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Recording time indicator */}
          <div className="text-gray-700 dark:text-gray-200 font-medium text-lg">
            {formatTime(recordingTime)}
          </div>

          {/* Confirm button */}
          <button
            onClick={onConfirm}
            className="h-12 w-12 rounded-full bg-gray-800 hover:bg-gray-900 dark:bg-gray-200 dark:hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label={t("confirm") || "Confirm"}
          >
            <Check className="h-5 w-5 text-white dark:text-gray-800" />
          </button>
        </div>
      </div>

      {/* Microphone selector */}
      {audioDevices.length > 0 && (
        <div className="mt-2">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
            {t("selectMicrophone") || "Select Microphone"}
          </label>
          <select
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
            value={selectedAudio}
            onChange={(e) => {
              if (onSelectAudio) {
                onSelectAudio(e.target.value);
              }
            }}
          >
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label ||
                  `Microphone ${device.deviceId.substring(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
