"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Sparkles, FileText } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateAnswerOnboardingDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("interviewQuestion.generateAnswerOnboarding");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Let AI Answer For You</DialogTitle>
          <DialogDescription className="text-lg pt-2">
            Too lazy to answer the question yourself? Let AI generate a
            personalized answer for you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-8">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black/5">
            <video
              src="/assets/generate-answer-demo.mp4"
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-primary shrink-0" />
                <h3 className="font-medium">AI-Powered Answers</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-7">
                Too lazy to answer the question yourself? Let AI generate an
                answer for you.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <h3 className="font-medium">Personalized to Your Experience</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-7">
                If you've uploaded your resume or cover letter, it will use your
                previous work experience to answer the question for you.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Got it!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
