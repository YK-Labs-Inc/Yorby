"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface JobDescriptionToggleProps {
  jobDescription: string;
}

export default function JobDescriptionToggle({ jobDescription }: JobDescriptionToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations("apply.recruiting.jobDescriptionToggle");

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("title")}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {t("subtitle")}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-[600px]" : "max-h-0"
        )}
      >
        <CardContent className="pt-0 pb-6">
          <div className="max-h-[500px] overflow-y-auto pr-2">
            <RichTextDisplay 
              content={jobDescription}
              prose="prose-sm"
              className="text-muted-foreground"
            />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}