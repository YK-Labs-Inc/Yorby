"use client";

import { Tables } from "@/utils/supabase/database.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";
import MuxPlayer from "@mux/mux-player-react";

interface MockInterviewReviewClientComponentV2Props {
  mockInterview: Tables<"custom_job_mock_interviews">;
  messages: (Tables<"mock_interview_messages"> & {
    mux_metadata?: Tables<"mock_interview_message_mux_metadata"> | null;
  })[];
  feedback: Tables<"custom_job_mock_interview_feedback">;
  questionFeedback: Tables<"mock_interview_question_feedback">[];
  muxMetadata: Tables<"mock_interview_mux_metadata"> | null;
}

type VideoSource = { muxPlaybackId?: string; supabaseUrl?: string } | null;

export default function MockInterviewReviewClientComponentV2({
  mockInterview,
  messages,
  feedback,
  questionFeedback,
  muxMetadata,
}: MockInterviewReviewClientComponentV2Props) {
  const t = useTranslations("mockInterviewReview");
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const tabsListRef = useRef<HTMLDivElement>(null);

  // State for video playback
  const [videoSource, setVideoSource] = useState<VideoSource>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  // Helper to get signed URL for Supabase Storage
  async function getSupabaseSignedUrl(
    bucket: string,
    path: string
  ): Promise<string | null> {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60); // 1 hour expiry
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    } catch (e) {
      return null;
    }
  }

  const navigateQuestion = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev"
        ? selectedQuestionIndex - 1
        : selectedQuestionIndex + 1;
    if (newIndex >= 0 && newIndex < questionFeedback.length) {
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

  // Handler for playing a message video
  const handlePlayMessageVideo = async (
    message: Tables<"mock_interview_messages"> & {
      mux_metadata?: Tables<"mock_interview_message_mux_metadata"> | null;
    }
  ) => {
    setLoadingVideo(true);
    if (message.mux_metadata && message.mux_metadata.playback_id) {
      setVideoSource({ muxPlaybackId: message.mux_metadata.playback_id });
    } else if (message.bucket_name && message.recording_path) {
      // fallback to Supabase Storage
      const url = await getSupabaseSignedUrl(
        message.bucket_name,
        message.recording_path
      );
      setVideoSource({ supabaseUrl: url ?? undefined });
    } else {
      setVideoSource(null);
    }
    setLoadingVideo(false);
    (videoRef.current as any)?.scrollIntoView?.({ behavior: "smooth" });
  };

  // Render the main video based on mux metadata status
  const renderMainVideo = () => {
    if (!muxMetadata) {
      return (
        <div className="w-full flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <span className="text-base font-medium">{t("video.processing")}</span>
          <span className="text-sm text-muted-foreground mt-1">
            {t("video.processingSubtext")}
          </span>
        </div>
      );
    }

    switch (muxMetadata.status) {
      case "preparing":
        return (
          <div className="w-full flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <span className="text-base font-medium">
              {t("video.processing")}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              {t("video.processingSubtext")}
            </span>
          </div>
        );

      case "errored":
        return (
          <div className="w-full flex flex-col items-center justify-center h-48 text-destructive text-center">
            <AlertCircle className="h-8 w-8 mb-2" />
            <span className="text-base font-medium">{t("video.failed")}</span>
            <span className="text-sm text-muted-foreground mt-1">
              {t("video.failedSubtext")}
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
            <div className="w-full flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
              <span className="text-base font-medium">
                {t("video.readyNoPlayback")}
              </span>
            </div>
          );
        }

      default:
        return (
          <div className="w-full flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
            <span className="text-base font-medium">
              {t("video.unknownStatus")}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 items-stretch">
      {/* Top Row: Video and Transcript */}
      <div className="col-span-12 grid grid-cols-12 gap-6">
        {/* Video Recording - Left column */}
        <div className="col-span-12 lg:col-span-6">
          <Card className="h-full min-h-[300px]">
            <CardHeader>
              <CardTitle>{t("video.title")}</CardTitle>
              <CardDescription>{t("video.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVideo ? (
                <div className="w-full flex items-center justify-center h-48">
                  {t("video.loading")}
                </div>
              ) : videoSource && videoSource.muxPlaybackId ? (
                <MuxPlayer
                  playbackId={videoSource.muxPlaybackId}
                  className="w-full rounded-lg"
                />
              ) : videoSource && videoSource.supabaseUrl ? (
                <video
                  ref={videoRef}
                  src={videoSource.supabaseUrl}
                  controls
                  className="w-full rounded-lg aspect-video"
                  autoPlay
                />
              ) : (
                renderMainVideo()
              )}
            </CardContent>
          </Card>
        </div>

        {/* Interview Transcript - Right column */}
        <Card className={`col-span-12 lg:col-span-6 h-full min-h-[300px]`}>
          <CardHeader>
            <CardTitle>{t("transcript.title")}</CardTitle>
            <CardDescription>{t("transcript.description")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] overflow-y-auto space-y-4">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`flex items-center gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Message bubble */}
                  <div
                    className={`markdown rounded-lg p-3 break-words ${
                      isUser
                        ? "bg-blue-500 text-white max-w-[70%]"
                        : "bg-gray-200 dark:bg-gray-800 max-w-[70%]"
                    }`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                  {/* Only show play button if main video is not available and message has a mux video */}
                  {(!muxMetadata || muxMetadata.status !== "ready") &&
                    message.mux_metadata &&
                    message.mux_metadata.playback_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-1"
                        title={t("transcript.playButtonTooltip")}
                        onClick={() => handlePlayMessageVideo(message)}
                      >
                        <PlayCircle className="w-6 h-6" />
                      </Button>
                    )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Overall Score */}
      <Card className="col-span-12 lg:col-span-4">
        <CardHeader>
          <CardTitle>{t("overallPerformance.title")}</CardTitle>
          <CardDescription>
            {t("overallPerformance.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">
                {t("overallPerformance.score")}
              </span>
              <span className="text-sm font-medium">
                {t("overallPerformance.scoreValue", { score: feedback.score })}
              </span>
            </div>
            <Progress value={feedback.score} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">
                {t("overallPerformance.jobFit")}
              </span>
              <span className="text-sm font-medium">
                {t("overallPerformance.jobFitValue", {
                  percentage: feedback.job_fit_percentage,
                })}
              </span>
            </div>
            <Progress value={feedback.job_fit_percentage} />
          </div>
        </CardContent>
      </Card>

      {/* Overall Feedback */}
      <Card className="col-span-12 lg:col-span-8">
        <CardHeader>
          <CardTitle>{t("overallFeedback.title")}</CardTitle>
          <CardDescription>{t("overallFeedback.description")}</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                {t("overallFeedback.overviewTitle")}
              </h3>
              <p className="text-muted-foreground">{feedback.overview}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {t("overallFeedback.jobFitAnalysisTitle")}
              </h3>
              <p className="text-muted-foreground">
                {feedback.job_fit_analysis}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {t("overallFeedback.keyImprovementsTitle")}
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                {feedback.key_improvements.map((improvement, i) => (
                  <li key={i}>{improvement}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>{t("questionReview.title")}</CardTitle>
          <CardDescription>{t("questionReview.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={selectedQuestionIndex.toString()}
            className="w-full"
            onValueChange={(value) => setSelectedQuestionIndex(parseInt(value))}
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
                {questionFeedback.map((qf, index) => (
                  <TabsTrigger key={qf.id} value={index.toString()}>
                    {t("questionReview.tab", { number: index + 1 })}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0"
                onClick={() => navigateQuestion("next")}
                disabled={selectedQuestionIndex === questionFeedback.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {questionFeedback.map((qf, index) => (
              <TabsContent
                key={qf.id}
                value={index.toString()}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">
                      {t("questionReview.questionTitle")}
                    </h3>
                    <p className="text-muted-foreground">{qf.question}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">
                      {t("questionReview.answerTitle")}
                    </h3>
                    <p className="text-muted-foreground">{qf.answer}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">
                      {t("questionReview.scoreTitle")}
                    </h3>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">
                        {t("questionReview.questionScore")}
                      </span>
                      <span className="text-sm font-medium">
                        {t("questionReview.scoreValue", { score: qf.score })}
                      </span>
                    </div>
                    <Progress value={qf.score} className="mb-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">
                        {t("questionReview.strengthsTitle")}
                      </h3>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        {qf.pros.map((pro, i) => (
                          <li key={i}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">
                        {t("questionReview.areasForImprovementTitle")}
                      </h3>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        {qf.cons.map((con, i) => (
                          <li key={i}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
