"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  FileText,
  FileCheck,
  Clock,
  Download,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChatTranscript,
  type ChatMessage,
} from "@/components/ui/chat-transcript";
import type { CandidateData } from "./actions";
import MuxPlayer from "@mux/mux-player-react";
import { useTranslations } from "next-intl";

interface CandidateOverviewProps {
  candidateData: CandidateData;
}

export default function CandidateOverview({
  candidateData,
}: CandidateOverviewProps) {
  const t = useTranslations("apply.recruiting.candidates.overview");
  const tTranscript = useTranslations(
    "apply.recruiting.candidates.chatTranscript"
  );
  const {
    candidate,
    applicationFiles,
    mockInterview,
    muxMetadata,
    mockInterviewMessages,
  } = candidateData;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return t("appliedOn", { date });
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getMimeTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType === "application/pdf") return "📄";
    if (mimeType.startsWith("text/")) return "📝";
    return "📎";
  };

  const renderInterviewVideo = () => {
    if (!muxMetadata) {
      return (
        <div className="w-full flex flex-col items-center justify-center h-48 text-muted-foreground text-center bg-gray-50 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <span className="text-base font-medium">{t("videoProcessing")}</span>
          <span className="text-sm text-muted-foreground mt-1">
            {t("videoProcessingDescription")}
          </span>
        </div>
      );
    }

    switch (muxMetadata.status) {
      case "preparing":
        return (
          <div className="w-full flex flex-col items-center justify-center h-48 text-muted-foreground text-center bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <span className="text-base font-medium">
              {t("videoProcessing")}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              {t("videoProcessingDescription")}
            </span>
          </div>
        );

      case "errored":
        return (
          <div className="w-full flex flex-col items-center justify-center h-48 text-destructive text-center bg-red-50 rounded-lg">
            <AlertCircle className="h-8 w-8 mb-2" />
            <span className="text-base font-medium">
              {t("videoProcessingFailed")}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              {t("videoProcessingFailedDescription")}
            </span>
          </div>
        );

      case "ready":
        if (muxMetadata.playback_id) {
          return (
            <MuxPlayer
              playbackId={muxMetadata.playback_id}
              className="w-full rounded-lg"
            />
          );
        } else {
          return (
            <div className="w-full flex flex-col items-center justify-center h-48 text-muted-foreground text-center bg-gray-50 rounded-lg">
              <span className="text-base font-medium">{t("videoReady")}</span>
            </div>
          );
        }

      default:
        return (
          <div className="w-full flex flex-col items-center justify-center h-48 text-muted-foreground text-center bg-gray-50 rounded-lg">
            <span className="text-base font-medium">
              {t("unknownVideoStatus")}
            </span>
          </div>
        );
    }
  };

  return (
    <Card className="h-full flex flex-col bg-white border shadow-sm">
      <CardHeader className="flex-shrink-0 border-b">
        <div>
          <CardTitle className="text-2xl">{candidate.candidate_name}</CardTitle>
          <CardDescription>{formatDate(candidate.applied_at)}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 flex-1 overflow-y-auto py-6">
        {/* Contact Information Section */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t("contactInformation")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{candidate.candidate_email}</span>
            </div>
            {candidate.candidate_phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{candidate.candidate_phone}</span>
              </div>
            )}
            {candidate.resume_url && (
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <a
                  href={candidate.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {t("viewResume")}
                </a>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Notes Section */}
        {candidate.notes && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t("notes")}
              </h3>
              <p className="text-sm">{candidate.notes}</p>
            </div>
            <Separator />
          </>
        )}

        {/* Application Files Section */}
        {applicationFiles && applicationFiles.length > 0 && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                {t("applicationFiles", { count: applicationFiles.length })}
              </h3>
              <div className="space-y-2">
                {applicationFiles.map((file: (typeof applicationFiles)[0]) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getMimeTypeIcon(file.user_file?.mime_type || "")}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {file.user_file?.display_name || t("unknownFile")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.user_file?.mime_type || t("unknownType")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.user_file?.signed_url && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              window.open(file.user_file.signed_url, "_blank")
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" asChild>
                            <a
                              href={file.user_file.signed_url}
                              download={file.user_file.display_name}
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Mock Interview Section */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t("mockInterview")}
          </h3>
          {mockInterview ? (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("status")}</span>
                    <span
                      className={`text-sm px-2 py-1 rounded-full ${
                        mockInterview.status === "complete"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {mockInterview.status === "complete"
                        ? t("complete")
                        : mockInterview.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("created")}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(mockInterview.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interview Video */}
              {mockInterview.status === "complete" && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">
                    {t("interviewRecording")}
                  </h4>
                  {renderInterviewVideo()}
                </div>
              )}

              {/* Interview Transcript */}
              {mockInterview.status === "complete" &&
                mockInterviewMessages.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">
                      {t("interviewTranscript")}
                    </h4>
                    <ChatTranscript
                      messages={mockInterviewMessages as ChatMessage[]}
                      userLabel={tTranscript("candidate")}
                      assistantLabel={tTranscript("interviewer")}
                      formatTimestamp={formatMessageTime}
                    />
                  </div>
                )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("noMockInterview")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
