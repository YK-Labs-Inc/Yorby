"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { H1 } from "@/components/typography";

interface FormData {
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  companyDescription: string;
  resume: File | null;
  coverLetter: File | null;
  miscDocuments: File[];
}

export default function JobCreationComponent() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    jobTitle: "",
    jobDescription: "",
    companyName: "",
    companyDescription: "",
    resume: null,
    coverLetter: null,
    miscDocuments: [],
  });

  const handleTextChange =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleFileChange =
    (field: "resume" | "coverLetter" | "miscDocuments") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;

      if (field === "miscDocuments") {
        setFormData((prev) => ({
          ...prev,
          miscDocuments: [
            ...prev.miscDocuments,
            ...Array.from(e.target.files || []),
          ],
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [field]: e.target.files?.[0] || null,
        }));
      }
    };

  const handleSubmit = async () => {
    // Placeholder for server action
    console.log("Submitting form data:", formData);
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <div className="px-4 sm:px-6">
      <H1 className="mb-4">Perfect Your Next Interview</H1>

      <div className="mb-8">
        <Progress value={step === 1 ? 50 : 100} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">
          Step {step} of 2:{" "}
          {step === 1 ? "Job Information" : "Documents Upload"}
        </p>
      </div>

      <Card className="w-full">
        <CardContent className="pt-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter job title"
                  value={formData.jobTitle}
                  onChange={handleTextChange("jobTitle")}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Paste the job description here"
                  value={formData.jobDescription}
                  onChange={handleTextChange("jobDescription")}
                  className="min-h-[200px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Company Name (Optional)
                </label>
                <Input
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={handleTextChange("companyName")}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Company Description (Optional)
                </label>
                <Textarea
                  placeholder="Enter company description"
                  value={formData.companyDescription}
                  onChange={handleTextChange("companyDescription")}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={
                    !formData.jobTitle.trim() || !formData.jobDescription.trim()
                  }
                >
                  Next Step
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Resume (Optional)
                </label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange("resume")}
                  className="cursor-pointer"
                  key={formData.resume ? formData.resume.name : "resume"}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Cover Letter (Optional)
                </label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange("coverLetter")}
                  className="cursor-pointer"
                  key={
                    formData.coverLetter
                      ? formData.coverLetter.name
                      : "coverLetter"
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Additional Documents (Optional)
                </label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange("miscDocuments")}
                  multiple
                  className="cursor-pointer"
                  key={formData.miscDocuments.length}
                />
                {formData.miscDocuments.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {formData.miscDocuments.length} files selected
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleSubmit}>Submit</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
