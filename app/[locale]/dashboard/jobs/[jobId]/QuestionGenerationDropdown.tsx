import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { GenerateInterviewQuestionsButton } from "./GenerateInterviewQuestionsButton";
import Link from "next/link";

interface QuestionGenerationDropdownProps {
  jobId: string;
}

export function QuestionGenerationDropdown({
  jobId,
}: QuestionGenerationDropdownProps) {
  const t = useTranslations("jobPage");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2">
          {t("generateQuestions")}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="gap-2" asChild>
          <GenerateInterviewQuestionsButton jobId={jobId} />
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 p-0 mt-1" asChild>
          <Link
            className="w-full"
            href={`/dashboard/jobs/${jobId}/upload-questions`}
          >
            <Button variant="secondary" className="w-full">
              <Upload className="h-4 w-4" />
              {t("uploadQuestions")}
            </Button>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
