"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Clock,
  Download,
  Eye,
  Lock,
} from "lucide-react";
import type {
  InterviewAnalysis,
  CandidateImportantData,
  CandidateInterviewData,
  CandidateBasicData,
} from "./actions";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import MuxPlayer from "@mux/mux-player-react";
import {
  ChatTranscript,
  type ChatMessage,
} from "@/components/ui/chat-transcript";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { CodeEditor } from "@/components/ui/code-editor";
import AggregatedHiringAnalysis from "./AggregatedHiringAnalysis";
import { CandidateLimitUpgradeDialog } from "./CandidateLimitUpgradeDialog";
import { FREE_TIER_INTERVIEW_COUNT } from "./constants";

interface InterviewAnalysisProps {
  candidateBasicData: CandidateBasicData;
  candidateImportantData?: CandidateImportantData | null;
  candidateInterviewData?: CandidateInterviewData | null;
  jobInterviewCount: number;
  isPremium: boolean;
}

export default function InterviewAnalysis({
  candidateBasicData,
  candidateImportantData,
  candidateInterviewData,
  jobInterviewCount,
  isPremium,
}: InterviewAnalysisProps) {
  const t = useTranslations("apply.recruiting.candidates.analysis");
  const tOverview = useTranslations("apply.recruiting.candidates.overview");
  const tTranscript = useTranslations(
    "apply.recruiting.candidates.chatTranscript"
  );
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedInterviewRound, setSelectedInterviewRound] = useState(0);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const tabsListRef = useRef<HTMLDivElement>(null);

  // Extract data from candidateInterviewData if provided
  const applicationFiles = candidateImportantData?.applicationFiles;
  const interviewResults = candidateInterviewData?.interviewResults;
  const interviewResult = interviewResults?.[selectedInterviewRound];
  const analysis = interviewResult?.interviewAnalysis;
  const hasMultipleRounds = interviewResults && interviewResults.length > 1;
  const aggregatedAnalysis = candidateImportantData?.aggregatedAnalysis;
  const jobAlignmentDetails = candidateImportantData?.jobAlignmentDetails;

  // Check if AI analysis should be locked for free tier
  const isLocked =
    !isPremium &&
    candidateBasicData?.candidate?.aiInterviewCompletionOrder &&
    candidateBasicData.candidate.aiInterviewCompletionOrder >
      FREE_TIER_INTERVIEW_COUNT;

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
    if (!interviewResult) return null;

    // First check if playback_id is present
    if (interviewResult.jobInterviewRecording?.playback_id) {
      return (
        <MuxPlayer
          playbackId={interviewResult.jobInterviewRecording.playback_id}
          className="w-full rounded-lg"
        />
      );
    }

    // If no playback_id, show appropriate status
    if (!interviewResult.jobInterviewRecording?.playback_id) {
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

    switch (interviewResult.jobInterviewRecording?.status) {
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
        return (
          <div className="w-full flex flex-col items-center justify-center h-48 text-muted-foreground text-center bg-gray-50 rounded-lg">
            <span className="text-base font-medium">
              {tOverview("videoReady")}
            </span>
          </div>
        );

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
    // If no job interviews exist, don't show anything
    if (jobInterviewCount === 0) {
      return null;
    }

    // If job interviews exist but candidate hasn't completed them, show appropriate message
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">
          {t("interviewNotCompleted.title")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("interviewNotCompleted.description")}
        </p>
      </div>
    );
  }

  // Show locked state for free tier users beyond 50 AI interviews
  if (isLocked) {
    return (
      <>
        <Separator className="my-6" />
        <div className="px-6">
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-muted rounded-full">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{t("locked.title")}</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {t("locked.description", { limit: FREE_TIER_INTERVIEW_COUNT })}
              </p>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p>
                  {t("locked.candidatePosition", {
                    position:
                      candidateBasicData?.candidate
                        ?.aiInterviewCompletionOrder ?? 0,
                    limit: FREE_TIER_INTERVIEW_COUNT,
                  })}
                </p>
              </div>
              <Button
                onClick={() => setShowUpgradeDialog(true)}
                className="mt-4"
                variant="default"
              >
                {t("locked.upgradeButton")}
              </Button>
            </div>
          </Card>
        </div>
        <CandidateLimitUpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          companyId={candidateBasicData?.candidate?.company_id || ""}
          totalCandidates={
            candidateBasicData?.candidate?.aiInterviewCompletionOrder || 0
          }
          viewedCandidates={FREE_TIER_INTERVIEW_COUNT}
        />
      </>
    );
  }

  return (
    <>
      <Separator className="my-6" />
      <div className="space-y-6 px-6">
        {/* Summary Cards Section */}
        {(aggregatedAnalysis || jobAlignmentDetails) && (
          <div className="w-full">
            {/* Hiring Decision Card */}
            {aggregatedAnalysis && (
              <AggregatedHiringAnalysis
                aggregatedAnalysis={aggregatedAnalysis}
                interviewResultsCount={interviewResults?.length || 0}
              />
            )}
          </div>
        )}

        {/* Interview Rounds Section */}
        {interviewResults && interviewResults.length > 0 && (
          <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {aggregatedAnalysis
                  ? t("individualRounds.title")
                  : t("interviewDetails")}
              </h2>
            </div>

            {/* Round Selector Tabs */}
            {hasMultipleRounds && (
              <div className="border-b border-gray-200">
                <div className="flex space-x-1 overflow-x-auto pb-px">
                  {interviewResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedInterviewRound(index)}
                      className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        index === selectedInterviewRound
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {result.interviewTitle}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Individual Round Badge and Selector for non-aggregated view */}
        {!aggregatedAnalysis && analysis && (
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
            {hasMultipleRounds && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("interviewRound")}:
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setSelectedInterviewRound(
                        Math.max(0, selectedInterviewRound - 1)
                      )
                    }
                    disabled={selectedInterviewRound === 0}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex gap-1">
                    {interviewResults.map((_, index) => (
                      <Button
                        key={index}
                        variant={
                          index === selectedInterviewRound
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedInterviewRound(index)}
                        className="h-8 w-8 p-0"
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setSelectedInterviewRound(
                        Math.min(
                          interviewResults.length - 1,
                          selectedInterviewRound + 1
                        )
                      )
                    }
                    disabled={
                      selectedInterviewRound === interviewResults.length - 1
                    }
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {interviewResult?.interviewType === "general" && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 overflow-x-auto">
              <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
              <TabsTrigger value="questions">{t("tabs.questions")}</TabsTrigger>
              <TabsTrigger value="strengths">{t("tabs.strengths")}</TabsTrigger>
              <TabsTrigger value="concerns">{t("tabs.concerns")}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {candidateInterviewData ? (
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
                            enableColor={true}
                          />
                        </div>

                        <Alert>
                          <AlertDescription className="text-sm break-words">
                            {analysis.verdict_summary || ""}
                          </AlertDescription>
                        </Alert>
                      </div>

                      <Separator />
                    </>
                  )}

                  {/* Interview Section */}
                  <div>
                    {interviewResult ? (
                      <div className="space-y-4">
                        {/* Interview Video */}
                        {interviewResult.candidateJobInterview?.status ===
                          "completed" && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">
                              {tOverview("interviewRecording")}
                            </h4>
                            {renderInterviewVideo()}
                          </div>
                        )}

                        {/* Interview Transcript */}
                        {interviewResult.candidateJobInterview?.status ===
                          "completed" &&
                          interviewResult.jobInterviewMessages &&
                          interviewResult.jobInterviewMessages.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">
                                {tOverview("interviewTranscript")}
                              </h4>
                              <ChatTranscript
                                messages={
                                  interviewResult.jobInterviewMessages as ChatMessage[]
                                }
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
                                    enableColor={true}
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
                    <Card
                      key={idx}
                      className="p-4 border-l-4 border-l-green-500"
                    >
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
          </Tabs>
        )}
        {interviewResult?.interviewType === "coding" && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 overflow-x-auto">
              <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
              <TabsTrigger value="question">{t("tabs.question")}</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4 mt-4">
              {candidateInterviewData ? (
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
                            enableColor={true}
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
                            date: new Date(
                              analysis.created_at
                            ).toLocaleString(),
                          })}
                        </div>
                      )}

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
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        asChild
                                      >
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

                  {/* Interview Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4" />
                      {tOverview("mockInterview")}
                      {hasMultipleRounds && (
                        <span className="text-xs font-normal">
                          (
                          {t("roundOf", {
                            current: selectedInterviewRound + 1,
                            total: interviewResults.length,
                          })}
                          )
                        </span>
                      )}
                    </h3>
                    {interviewResult ? (
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {tOverview("status")}
                              </span>
                              <span
                                className={`text-sm px-2 py-1 rounded-full ${
                                  interviewResult.candidateJobInterview
                                    ?.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {interviewResult.candidateJobInterview
                                  ?.status === "completed"
                                  ? tOverview("complete")
                                  : interviewResult.candidateJobInterview
                                      ?.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {tOverview("created")}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(
                                  interviewResult.candidateJobInterview
                                    ?.created_at!
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Interview Video */}
                        {interviewResult.candidateJobInterview?.status ===
                          "completed" && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">
                              {tOverview("interviewRecording")}
                            </h4>
                            {renderInterviewVideo()}
                          </div>
                        )}

                        {/* Interview Transcript */}
                        {interviewResult.candidateJobInterview?.status ===
                          "completed" &&
                          interviewResult.jobInterviewMessages &&
                          interviewResult.jobInterviewMessages.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">
                                {tOverview("interviewTranscript")}
                              </h4>
                              <ChatTranscript
                                messages={
                                  interviewResult.jobInterviewMessages as ChatMessage[]
                                }
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
            <TabsContent value="question" className="space-y-4 mt-4">
              {interviewResult?.codingInterviewAnalysis && (
                <div className="w-full space-y-6">
                  {/* Question Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      {tOverview("codingQuestion")}
                    </h3>
                    <RichTextDisplay
                      content={
                        interviewResult.codingInterviewAnalysis.question_text ||
                        ""
                      }
                      prose="prose-sm"
                      className="max-h-[300px] overflow-y-auto"
                    />
                  </div>

                  {/* Submission Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      {tOverview("codingSubmission")}
                    </h3>
                    <CodeEditor
                      className="w-full"
                      minHeight="300px"
                      value={
                        interviewResult.codingInterviewAnalysis
                          .user_last_submission || ""
                      }
                      onChange={() => {}}
                    />
                  </div>

                  {/* Strengths and Weaknesses Section */}
                  {((interviewResult.codingInterviewAnalysis
                    .interview_strengths &&
                    interviewResult.codingInterviewAnalysis.interview_strengths
                      .length > 0) ||
                    (interviewResult.codingInterviewAnalysis
                      .interview_weaknesses &&
                      interviewResult.codingInterviewAnalysis
                        .interview_weaknesses.length > 0)) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      {/* Strengths */}
                      {interviewResult.codingInterviewAnalysis
                        .interview_strengths &&
                        interviewResult.codingInterviewAnalysis
                          .interview_strengths.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              {t("codingInterview.strengths")}
                            </h3>
                            <div className="space-y-3">
                              {interviewResult.codingInterviewAnalysis.interview_strengths.map(
                                (strength, index) => (
                                  <Card
                                    key={strength.id || index}
                                    className="p-4 border-l-4 border-l-green-600"
                                  >
                                    <div className="space-y-2">
                                      <h4 className="font-medium text-sm">
                                        {strength.title}
                                      </h4>
                                      {strength.relevance && (
                                        <p className="text-sm text-muted-foreground">
                                          {strength.relevance}
                                        </p>
                                      )}
                                    </div>
                                  </Card>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Weaknesses/Concerns */}
                      {interviewResult.codingInterviewAnalysis
                        .interview_weaknesses &&
                        interviewResult.codingInterviewAnalysis
                          .interview_weaknesses.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              {t("codingInterview.areasForImprovement")}
                            </h3>
                            <div className="space-y-3">
                              {interviewResult.codingInterviewAnalysis.interview_weaknesses.map(
                                (weakness, index) => (
                                  <Card
                                    key={weakness.id || index}
                                    className="p-4 border-l-4 border-l-amber-600"
                                  >
                                    <div className="space-y-2">
                                      <h4 className="font-medium text-sm">
                                        {weakness.title}
                                      </h4>
                                      <p className="text-sm text-muted-foreground">
                                        {weakness.description}
                                      </p>
                                    </div>
                                  </Card>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* No Analysis Available */}
                  {(!interviewResult.codingInterviewAnalysis
                    .interview_strengths ||
                    interviewResult.codingInterviewAnalysis.interview_strengths
                      .length === 0) &&
                    (!interviewResult.codingInterviewAnalysis
                      .interview_weaknesses ||
                      interviewResult.codingInterviewAnalysis
                        .interview_weaknesses.length === 0) && (
                      <Alert className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {t("codingInterview.noDetailedAnalysis")}
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}
