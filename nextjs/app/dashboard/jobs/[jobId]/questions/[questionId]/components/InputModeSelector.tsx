"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Video, Mic, Type } from "lucide-react";

export type InputMode = "video" | "audio" | "text";

interface InputModeSelectorProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  disabled?: boolean;
}

export default function InputModeSelector({
  mode,
  onModeChange,
  disabled = false,
}: InputModeSelectorProps) {
  const t = useTranslations("interviewQuestion");

  const modes = [
    {
      id: "video" as const,
      label: t("inputModes.video", { default: "Video" }),
      icon: Video,
      description: t("inputModes.videoDescription", {
        default: "Record your answer with video and audio",
      }),
    },
    {
      id: "audio" as const,
      label: t("inputModes.audio", { default: "Audio" }),
      icon: Mic,
      description: t("inputModes.audioDescription", {
        default: "Record your voice only",
      }),
    },
    {
      id: "text" as const,
      label: t("inputModes.text", { default: "Text" }),
      icon: Type,
      description: t("inputModes.textDescription", {
        default: "Type your answer",
      }),
    },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">
            {t("inputModes.title", { default: "Choose how to answer" })}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {modes.map((modeConfig) => {
              const Icon = modeConfig.icon;
              const isSelected = mode === modeConfig.id;

              return (
                <Button
                  key={modeConfig.id}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => onModeChange(modeConfig.id)}
                  disabled={disabled}
                  className="h-auto p-3 flex flex-col items-center gap-2 text-center"
                >
                  <Icon className="h-5 w-5" />
                  <div className="space-y-1">
                    <div className="font-medium text-sm">
                      {modeConfig.label}
                    </div>
                    <div className="text-xs opacity-80 leading-tight">
                      {modeConfig.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
