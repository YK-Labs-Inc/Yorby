"use client";

import React, { useState } from "react";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import UploadQuestionsClient from "./UploadQuestionsClient";
import type { Tables } from "@/utils/supabase/database.types";

interface QuestionGenerationDropdownProps {
  jobId: string;
  job: Tables<"custom_jobs">;
}

export function QuestionGenerationDropdown({
  jobId,
  job,
}: QuestionGenerationDropdownProps) {
  const t = useTranslations("jobPage");
  const [open, setOpen] = useState(false);

  return (
    <>
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
          <DropdownMenuItem
            className="gap-2 p-0 mt-1 cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
          >
            <Button variant="secondary" className="w-full" type="button">
              <Upload className="h-4 w-4" />
              {t("uploadQuestions")}
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-full p-0 bg-transparent border-0 shadow-none">
          <div className="w-full max-h-[70vh] h-auto flex items-center justify-center overflow-y-auto">
            <UploadQuestionsClient jobId={jobId} job={job} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
