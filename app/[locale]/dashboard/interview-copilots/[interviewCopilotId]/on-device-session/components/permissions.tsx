"use client";

import { useState } from "react";
import { Mic, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

interface PermissionsProps {
  onNext: () => void;
}

export function Permissions({ onNext }: PermissionsProps) {
  const t = useTranslations("interviewCopilots.devicePermissions");
  const [audioPermission, setAudioPermission] = useState<boolean>(false);
  const [videoPermission, setVideoPermission] = useState<boolean>(false);
  const { logError } = useAxiomLogging();

  const requestAudioPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setAudioPermission(true);
    } catch (error) {
      logError(t("errors.audio"), { error });
    }
  };

  const requestVideoPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setVideoPermission(true);
    } catch (error) {
      logError(t("errors.video"), { error });
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            {t("title")}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{t("subtitle")}</p>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Mic className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {t("audio.title")}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t("audio.description")}
                  </p>
                  <p className="text-sm mt-1 font-medium">
                    {t("audio.instruction")}
                  </p>
                </div>
              </div>
              <Button
                onClick={requestAudioPermission}
                variant={audioPermission ? "outline" : "secondary"}
                className={
                  audioPermission
                    ? "text-green-700 bg-green-100 hover:bg-green-100 hover:text-green-700"
                    : ""
                }
                disabled={audioPermission}
              >
                {audioPermission ? t("audio.granted") : t("audio.request")}
              </Button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Video className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {t("video.title")}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t("video.description")}
                  </p>
                  <p className="text-sm mt-1 font-medium">
                    {t("video.instruction")}
                  </p>
                </div>
              </div>
              <Button
                onClick={requestVideoPermission}
                variant={videoPermission ? "outline" : "secondary"}
                className={
                  videoPermission
                    ? "text-green-700 bg-green-100 hover:bg-green-100 hover:text-green-700"
                    : ""
                }
                disabled={videoPermission}
              >
                {videoPermission ? t("video.granted") : t("video.request")}
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={onNext}
              className="w-full"
              size="lg"
              disabled={!audioPermission || !videoPermission}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
