"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShareButton } from "@/components/ui/share-button";
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  XCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Clock,
  Download,
  Eye,
} from "lucide-react";
import type { InterviewAnalysis, CandidateData } from "./actions";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import MuxPlayer from "@mux/mux-player-react";
import {
  ChatTranscript,
  type ChatMessage,
} from "@/components/ui/chat-transcript";

interface InterviewAnalysisProps {
  analysis: InterviewAnalysis | null;
  candidateData?: CandidateData;
}

export default function InterviewAnalysis({
  analysis,
  candidateData,
}: InterviewAnalysisProps) {
  const t = useTranslations("apply.recruiting.candidates.analysis");
  const tOverview = useTranslations("apply.recruiting.candidates.overview");
  const tTranscript = useTranslations(
    "apply.recruiting.candidates.chatTranscript"
  );
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const tabsListRef = useRef<HTMLDivElement>(null);

  // Extract data from candidateData if provided
  const candidate = candidateData?.candidate;
  const applicationFiles = candidateData?.applicationFiles;
  const mockInterview = candidateData?.mockInterview;
  const muxMetadata = candidateData?.muxMetadata;
  const mockInterviewMessages = candidateData?.mockInterviewMessages;

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return tOverview("appliedOn", { date });
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
          <span className="text-base font-medium">
            {tOverview("videoProcessing")}
          </span>
          <span className="text-sm text-muted-foreground mt-1">
            {tOverview("videoProcessingDescription")}
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
              {tOverview("videoProcessing")}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              {tOverview("videoProcessingDescription")}
            </span>
          </div>
        );

      case "errored":
        return (
          <div className="w-full flex flex-col items-center justify-center h-48 text-destructive text-center bg-red-50 rounded-lg">
            <AlertCircle className="h-8 w-8 mb-2" />
            <span className="text-base font-medium">
              {tOverview("videoProcessingFailed")}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              {tOverview("videoProcessingFailedDescription")}
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
              <span className="text-base font-medium">
                {tOverview("videoReady")}
              </span>
            </div>
          );
        }

      default:
        return (
          <div className="w-full flex flex-col items-center justify-center h-48 text-muted-foreground text-center bg-gray-50 rounded-lg">
            <span className="text-base font-medium">
              {tOverview("unknownVideoStatus")}
            </span>
          </div>
        );
    }
  };


  // Navigate between questions
  const navigateQuestion = (direction: "prev" | "next") => {
    if (!analysis?.question_analysis) return;

    const newIndex =
      direction === "prev"
        ? selectedQuestionIndex - 1
        : selectedQuestionIndex + 1;
    if (newIndex >= 0 && newIndex < analysis.question_analysis.length) {
      setSelectedQuestionIndex(newIndex);

      // Ensure the selected tab is visible by scrolling it into view
      const tabElement = tabsListRef.current?.children[newIndex] as HTMLElement;
      const tabsList = tabsListRef.current;
      if (tabElement && tabsList) {
        const tabsListRect = tabsList.getBoundingClientRect();
        const tabRect = tabElement.getBoundingClientRect();

        if (direction === "next" && tabRect.right > tabsListRect.right) {
          tabsList.scrollTo({
            left:
              tabsList.scrollLeft + (tabRect.right - tabsListRect.right) + 16, // 16px padding
            behavior: "smooth",
          });
        } else if (direction === "prev" && tabRect.left < tabsListRect.left) {
          tabsList.scrollTo({
            left: tabsList.scrollLeft - (tabsListRect.left - tabRect.left) - 16,
            behavior: "smooth",
          });
        }
      }
    }
  };

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">
          {t("errorState.noAnalysis")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t.rich("errorState.contactSupport", {
            email: "support@yklabs.io",
            emailLink: (chunks) => (
              <a
                href="mailto:support@yklabs.io"
                className="text-primary underline"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant={
              analysis.hiring_verdict === "ADVANCE"
                ? "success"
                : analysis.hiring_verdict === "REJECT"
                  ? "destructive"
                  : "secondary"
            }
          >
            {t(
              `verdict.${(analysis.hiring_verdict || "BORDERLINE").toLowerCase()}`
            )}
          </Badge>
        </div>
      </div>
      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 overflow-x-auto">
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="questions">{t("tabs.questions")}</TabsTrigger>
          <TabsTrigger value="strengths">{t("tabs.strengths")}</TabsTrigger>
          <TabsTrigger value="concerns">{t("tabs.concerns")}</TabsTrigger>
          <TabsTrigger value="alignment">{t("tabs.alignment")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {candidateData ? (
            <>
              {/* AI Interview Analysis Summary - Top of Overview */}
              {analysis && (
                <>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {t("overallMatch")}
                        </span>
                        <span className="text-sm font-bold">
                          {analysis.overall_match_score || 0}%
                        </span>
                      </div>
                      <Progress
                        value={analysis.overall_match_score || 0}
                        className="h-2"
                      />
                    </div>

                    <Alert>
                      <AlertDescription className="text-sm break-words">
                        {analysis.verdict_summary || ""}
                      </AlertDescription>
                    </Alert>
                  </div>

                  {/* Processing info */}
                  {analysis.created_at && (
                    <div className="text-xs text-muted-foreground text-right">
                      {t("processedAt", {
                        date: new Date(analysis.created_at).toLocaleString(),
                      })}
                    </div>
                  )}

                  <Separator />
                </>
              )}

              {/* Notes Section */}
              {candidate?.notes && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      {tOverview("notes")}
                    </h3>
                    <p className="text-sm break-words">{candidate.notes}</p>
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
                      {tOverview("applicationFiles", {
                        count: applicationFiles.length,
                      })}
                    </h3>
                    <div className="space-y-2">
                      {applicationFiles.map(
                        (file: (typeof applicationFiles)[0]) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 gap-2"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-2xl flex-shrink-0">
                                {getMimeTypeIcon(
                                  file.user_file?.mime_type || ""
                                )}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium break-words">
                                  {file.user_file?.display_name ||
                                    tOverview("unknownFile")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {file.user_file?.mime_type ||
                                    tOverview("unknownType")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {file.user_file?.signed_url && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() =>
                                      window.open(
                                        file.user_file.signed_url,
                                        "_blank"
                                      )
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
                        )
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Mock Interview Section */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {tOverview("mockInterview")}
                </h3>
                {mockInterview ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {tOverview("status")}
                          </span>
                          <span
                            className={`text-sm px-2 py-1 rounded-full ${
                              mockInterview.status === "complete"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {mockInterview.status === "complete"
                              ? tOverview("complete")
                              : mockInterview.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {tOverview("created")}
                          </span>
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
                          {tOverview("interviewRecording")}
                        </h4>
                        {renderInterviewVideo()}
                      </div>
                    )}

                    {/* Interview Transcript */}
                    {mockInterview.status === "complete" &&
                      mockInterviewMessages &&
                      mockInterviewMessages.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">
                            {tOverview("interviewTranscript")}
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
                    {tOverview("noMockInterview")}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("overviewContent")}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-4 mt-4">
          {analysis.question_analysis &&
          Array.isArray(analysis.question_analysis) &&
          analysis.question_analysis.length > 0 ? (
            <div>
              <Tabs
                value={selectedQuestionIndex.toString()}
                className="w-full"
                onValueChange={(value) =>
                  setSelectedQuestionIndex(parseInt(value))
                }
              >
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => navigateQuestion("prev")}
                    disabled={selectedQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <TabsList
                    ref={tabsListRef}
                    className="w-full justify-start overflow-x-auto scrollbar-hide flex-1"
                  >
                    {analysis.question_analysis.map((qa, index) => (
                      <TabsTrigger key={qa.id} value={index.toString()}>
                        {t("questionTab", { number: index + 1 })}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => navigateQuestion("next")}
                    disabled={
                      selectedQuestionIndex ===
                      analysis.question_analysis.length - 1
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {analysis.question_analysis.map((qa, index) => (
                  <TabsContent
                    key={qa.id}
                    value={index.toString()}
                    className="space-y-4"
                  >
                    <Card className="p-6">
                      <div className="space-y-6">
                        {/* Question */}
                        <div>
                          <h3 className="font-semibold mb-2 text-base">
                            {t("questionTitle")}
                          </h3>
                          <p className="text-muted-foreground break-words">
                            {qa.question_text}
                          </p>
                        </div>

                        {/* User Answer */}
                        <div>
                          <h3 className="font-semibold mb-2 text-base">
                            {t("userAnswer")}
                          </h3>
                          <p className="text-muted-foreground break-words bg-gray-50 p-4 rounded-lg">
                            {qa.user_answer}
                          </p>
                        </div>

                        {/* Analysis Section */}
                        <div className="space-y-4">
                          {/* Key Points */}
                          {qa.key_points && qa.key_points.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2 text-base flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                {t("keyPoints")}
                              </h3>
                              <ul className="space-y-2">
                                {qa.key_points.map((point, i) => (
                                  <li
                                    key={i}
                                    className="border-l-4 border-l-green-500 pl-3 py-2"
                                  >
                                    <span className="text-sm break-words">
                                      {point}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Concerns */}
                          {qa.concerns && qa.concerns.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2 text-base flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                                {t("concerns")}
                              </h3>
                              <ul className="space-y-2">
                                {qa.concerns.map((concern, i) => (
                                  <li
                                    key={i}
                                    className="border-l-4 border-l-orange-500 pl-3 py-2"
                                  >
                                    <span className="text-sm break-words">
                                      {concern}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Examples Provided */}
                          {qa.examples_provided &&
                          qa.examples_provided.length > 0 ? (
                            <div>
                              <h3 className="font-semibold mb-2 text-base flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                {t("examplesProvided")}
                              </h3>
                              <ul className="space-y-2">
                                {qa.examples_provided.map((example, i) => (
                                  <li
                                    key={i}
                                    className="border-l-4 border-l-blue-500 pl-3 py-2"
                                  >
                                    <span className="text-sm break-words">
                                      {example}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold mb-2 text-base">
                                {t("examplesProvided")}
                              </h3>
                              <div className="flex items-center gap-2">
                                <XCircle className="h-5 w-5 text-orange-600" />
                                <span className="text-orange-700 font-medium">
                                  {t("no")}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Score */}
                          {qa.answer_quality_score !== null && (
                            <div>
                              <h3 className="font-semibold mb-2 text-base">
                                {t("qualityScore")}
                              </h3>
                              <div className="flex items-center gap-4">
                                <Progress
                                  value={qa.answer_quality_score}
                                  className="flex-1"
                                />
                                <Badge
                                  variant={
                                    qa.answer_quality_score >= 80
                                      ? "default"
                                      : qa.answer_quality_score >= 60
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {qa.answer_quality_score}%
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("noQuestionAnalysis")}
            </p>
          )}
        </TabsContent>

        <TabsContent value="strengths" className="space-y-4 mt-4">
          {analysis.strengths &&
          Array.isArray(analysis.strengths) &&
          analysis.strengths.length > 0 ? (
            <div className="space-y-3">
              {analysis.strengths.map((strength, idx) => (
                <Card key={idx} className="p-4 border-l-4 border-l-green-500">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-medium text-sm mb-3 break-words">
                        {strength.title}
                      </h5>

                      {/* Candidate's Response */}
                      <div className="mb-3">
                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                          <p className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">
                            {t("candidateResponse")}
                          </p>
                          <p className="text-sm text-gray-700 italic break-words">
                            "{strength.evidence}"
                          </p>
                        </div>
                      </div>

                      {/* AI Analysis */}
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">
                          {t("answerAnalysis")}
                        </p>
                        <p className="text-sm text-gray-700 break-words">
                          {strength.relevance}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("noStrengths")}
            </p>
          )}
        </TabsContent>

        <TabsContent value="concerns" className="space-y-4 mt-4">
          {analysis.concerns &&
          Array.isArray(analysis.concerns) &&
          analysis.concerns.length > 0 ? (
            <div className="space-y-3">
              {analysis.concerns.map((concern, idx) => (
                <Card
                  key={idx}
                  className="p-4 border-l-4 border-l-orange-500"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-medium text-sm mb-2 break-words">
                        {concern.title}
                      </h5>
                      <p className="text-sm text-gray-700 mb-2 break-words">
                        {concern.description}
                      </p>
                      {concern.evidence && (
                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                          <p className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">
                            {t("evidence")}
                          </p>
                          <p className="text-xs text-gray-600 italic break-words">
                            "{concern.evidence}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("noConcerns")}
            </p>
          )}
        </TabsContent>

        <TabsContent value="alignment" className="space-y-4 mt-4">
          <div className="space-y-4">
            {/* Matched Requirements */}
            {analysis.matched_requirements &&
              analysis.matched_requirements.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {t("matchedRequirements")}
                  </h4>
                  <ul className="space-y-2">
                    {analysis.matched_requirements.map((req, idx) => (
                      <li
                        key={idx}
                        className="text-sm border-l-4 border-l-green-500 pl-3 py-2"
                      >
                        <span className="break-words">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Exceeded Requirements */}
            {analysis.exceeded_requirements &&
              analysis.exceeded_requirements.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-blue-700">
                    <TrendingUp className="h-4 w-4" />
                    {t("exceededRequirements")}
                  </h4>
                  <ul className="space-y-2">
                    {analysis.exceeded_requirements.map((req, idx) => (
                      <li
                        key={idx}
                        className="text-sm border-l-4 border-l-blue-500 pl-3 py-2"
                      >
                        <span className="break-words">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Missing Requirements */}
            {analysis.missing_requirements &&
              analysis.missing_requirements.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-700">
                    <XCircle className="h-4 w-4" />
                    {t("missingRequirements")}
                  </h4>
                  <ul className="space-y-2">
                    {analysis.missing_requirements.map((req, idx) => (
                      <li
                        key={idx}
                        className="text-sm border-l-4 border-l-red-500 pl-3 py-2"
                      >
                        <span className="break-words">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
