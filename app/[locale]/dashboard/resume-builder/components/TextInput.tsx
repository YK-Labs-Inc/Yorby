"use client";

import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";

interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
}

export default function TextInput({ value, onChange }: TextInputProps) {
  const t = useTranslations("resumeBuilder");

  return (
    <div className="space-y-4">
      <Textarea
        placeholder={t("resumeInputPlaceholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        className="resize-y min-h-[200px]"
      />

      <div className="text-sm text-gray-500">{t("textInstructions")}</div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-md text-sm">
        <h4 className="font-medium mb-2">{t("proTips")}</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li>{t("tipDates")}</li>
          <li>{t("tipTechnologies")}</li>
          <li>{t("tipQuantify")}</li>
          <li>{t("tipCertifications")}</li>
          <li>{t("tipLanguages")}</li>
        </ul>
      </div>
    </div>
  );
}
