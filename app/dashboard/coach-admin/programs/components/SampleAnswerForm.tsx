"use client";

import React, { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle, Loader2, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslations } from "next-intl";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { createSampleAnswer } from "../[programId]/questions/[questionId]/sample-answers/new/actions";
import { editSampleAnswer } from "../[programId]/questions/[questionId]/sample-answers/[answerId]/edit/actions";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import SpeechToTextModal from "@/app/dashboard/jobs/[jobId]/questions/[questionId]/SpeechToTextModal";

// Define the form schema with validation
const sampleAnswerFormSchema = z.object({
  answer: z.string().min(1, {
    message: "Sample answer is required",
  }),
  bucket: z.string().optional(),
  file_path: z.string().optional(),
});

type SampleAnswerFormValues = z.infer<typeof sampleAnswerFormSchema>;

interface SampleAnswerFormProps {
  initialValues?: {
    answer?: string;
    initialAudioUrl?: string;
    initialAudioFilePath?: string;
  };
  programId: string;
  questionId: string;
  answerId?: string;
  onCancelRedirectUrl: string;
  isEditing?: boolean;
}

// Move the current SampleAnswerForm logic to an internal component
function InternalSampleAnswerForm({
  initialValues = {},
  programId,
  questionId,
  answerId,
  onCancelRedirectUrl,
  isEditing = false,
}: SampleAnswerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logError } = useAxiomLogging();
  const router = useRouter();
  const t = useTranslations(
    "coachAdminPortal.sampleAnswersPage.sampleAnswerForm"
  );
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(
    initialValues.initialAudioUrl || null
  );
  const [originalAudioFilePath] = useState<string | undefined>(
    initialValues.initialAudioFilePath
  );
  const [isUploading, setIsUploading] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null
  );
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize the form with default values or provided initial values
  const form = useForm<SampleAnswerFormValues>({
    resolver: zodResolver(sampleAnswerFormSchema),
    defaultValues: {
      answer: initialValues.answer || "",
    },
  });

  // Handle audio file upload
  const handleAudioFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    // Transcribe uploaded audio
    try {
      const formData = new FormData();
      formData.append("audioFileToTranscribe", file);
      formData.append("source", "sample-answer");
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Transcription failed");
      const { transcription } = await response.json();
      if (transcription) {
        form.setValue("answer", transcription);
      }
    } catch (err: any) {
      setTranscriptionError("Transcription failed. Please try again.");
      logError("Audio transcription failed in SampleAnswerForm", {
        error: err,
      });
    }
  };

  // Remove audio
  const handleRemoveAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscriptionError(null);
  };

  // Upload audio to Supabase Storage and return file_path
  const uploadAudioToSupabase = async (blob: Blob) => {
    const supabase = createSupabaseBrowserClient();
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) throw new Error("User not authenticated");
    const fileExt = blob.type.split("/")[1] || "webm";
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/programs/${programId}/questions/${questionId}/sample-answer/${fileName}`;
    const { error } = await supabase.storage
      .from("coach_files")
      .upload(filePath, blob, { upsert: true });
    if (error) throw error;
    return filePath;
  };

  // Handle form submission
  const handleSubmit = async (values: SampleAnswerFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setIsUploading(false);
    try {
      let bucket: string | undefined = undefined;
      let file_path: string | undefined = undefined;
      if (audioBlob) {
        setIsUploading(true);
        file_path = await uploadAudioToSupabase(audioBlob);
        bucket = "coach_files";
        setIsUploading(false);
      } else if (audioUrl && !audioBlob && originalAudioFilePath) {
        // If using initial audio and not changed, keep the original file path
        file_path = originalAudioFilePath;
        bucket = "coach_files";
      }
      if (isEditing && answerId) {
        await handleEditSampleAnswer({
          sampleAnswer: values.answer,
          programId,
          questionId,
          sampleAnswerId: answerId,
          bucket,
          file_path,
        });
      } else {
        await handleCreateSampleAnswer({
          sampleAnswer: values.answer,
          programId,
          questionId,
          bucket,
          file_path,
        });
      }
    } catch (err) {
      setError(t("genericError"));
      logError("Create job form submission error:", { error: err });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleEditSampleAnswer = async ({
    sampleAnswer,
    programId,
    questionId,
    sampleAnswerId,
    bucket,
    file_path,
  }: {
    sampleAnswer: string;
    programId: string;
    questionId: string;
    sampleAnswerId: string;
    bucket?: string;
    file_path?: string;
  }) => {
    const formData = new FormData();
    formData.append("answer", sampleAnswer);
    formData.append("programId", programId);
    formData.append("questionId", questionId);
    formData.append("sampleAnswerId", sampleAnswerId);
    if (bucket) formData.append("bucket", bucket);
    if (file_path) formData.append("file_path", file_path);
    const result = await editSampleAnswer(formData);
    if (result.success) {
      router.push(
        `/dashboard/coach-admin/programs/${programId}/questions/${questionId}`
      );
    } else {
      setError(result.message || t("genericError"));
    }
  };

  const handleCreateSampleAnswer = async ({
    sampleAnswer,
    programId,
    questionId,
    bucket,
    file_path,
  }: {
    sampleAnswer: string;
    programId: string;
    questionId: string;
    bucket?: string;
    file_path?: string;
  }) => {
    const formData = new FormData();
    formData.append("answer", sampleAnswer);
    formData.append("programId", programId);
    formData.append("questionId", questionId);
    if (bucket) formData.append("bucket", bucket);
    if (file_path) formData.append("file_path", file_path);
    const result = await createSampleAnswer(formData);
    if (result.success) {
      router.push(
        `/dashboard/coach-admin/programs/${programId}/questions/${questionId}`
      );
    } else {
      setError(result.message || t("genericError"));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? t("editTitle") : t("createTitle")}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            {/* Error alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("errorTitle")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {/* Audio controls */}
            <div className="space-y-2">
              <label className="block font-medium">
                Audio Sample (optional)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleAudioFileChange}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => audioInputRef.current?.click()}
                  disabled={isSubmitting || isUploading}
                >
                  Upload Audio
                </Button>
                <SpeechToTextModal
                  disabled={isSubmitting || isUploading}
                  onTranscriptionComplete={(text, blob) => {
                    setAudioBlob(blob);
                    setAudioUrl(URL.createObjectURL(blob));
                    form.setValue("answer", text);
                  }}
                />
                {(audioBlob || audioUrl) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveAudio}
                    disabled={isSubmitting || isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {audioUrl && (
                <audio controls src={audioUrl} className="mt-2 w-full" />
              )}
              {transcriptionError && (
                <div className="text-sm text-red-500">{transcriptionError}</div>
              )}
              {isUploading && (
                <div className="text-sm text-muted-foreground">
                  Uploading audio...
                </div>
              )}
            </div>
            {/* Sample Answer */}
            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("answerLabel")}*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("answerPlaceholder")}
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(onCancelRedirectUrl)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? t("saving") : t("creating")}
                </>
              ) : isEditing ? (
                t("saveChanges")
              ) : (
                t("create")
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

// Default export: wraps InternalSampleAnswerForm in MediaDeviceProvider
export default function SampleAnswerForm(props: SampleAnswerFormProps) {
  return <InternalSampleAnswerForm {...props} />;
}
