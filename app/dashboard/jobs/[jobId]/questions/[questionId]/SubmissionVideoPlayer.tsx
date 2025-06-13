"use client";

import { Tables } from "@/utils/supabase/database.types";
import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useTranslations } from "next-intl";
import MuxPlayer from "@mux/mux-player-react";

interface SubmissionVideoPlayerProps {
  currentSubmission:
    | (Tables<"custom_job_question_submissions"> & {
        mux_metadata?: Tables<"custom_job_question_submission_mux_metadata"> | null;
      })
    | null;
}

type VideoSource =
  | { type: "mux"; playbackId: string }
  | { type: "supabase"; url: string; isAudio: boolean }
  | { type: "preparing" }
  | { type: "loading" }
  | null;

export default function SubmissionVideoPlayer({
  currentSubmission,
}: SubmissionVideoPlayerProps) {
  const { logError } = useAxiomLogging();
  const t = useTranslations("interviewQuestion.videoPlayer");

  // Helper to detect if file is audio based on extension
  const isAudioFile = (filePath: string): boolean => {
    const audioExtensions = [
      ".mp3",
      ".wav",
      ".m4a",
      ".aac",
      ".ogg",
      ".flac",
      ".webm",
    ];
    const extension = filePath
      .toLowerCase()
      .substring(filePath.lastIndexOf("."));
    return audioExtensions.includes(extension);
  };

  // Video playback states
  const [supabaseMediaUrl, setSupabaseMediaUrl] = useState<string | null>(null);
  const [loadingSupabaseVideo, setLoadingSupabaseVideo] = useState(false);

  // Helper to get signed URL for Supabase Storage
  const getSupabaseSignedUrl = async (
    bucket: string,
    path: string
  ): Promise<string | null> => {
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
  };

  // Load Supabase video when needed
  useEffect(() => {
    const loadSupabaseVideo = async () => {
      if (
        currentSubmission?.audio_bucket &&
        currentSubmission?.audio_file_path &&
        !supabaseMediaUrl &&
        !loadingSupabaseVideo
      ) {
        setLoadingSupabaseVideo(true);
        try {
          const url = await getSupabaseSignedUrl(
            currentSubmission.audio_bucket,
            currentSubmission.audio_file_path
          );
          setSupabaseMediaUrl(url);
        } catch (error) {
          logError("Error loading Supabase video", { error });
        } finally {
          setLoadingSupabaseVideo(false);
        }
      }
    };

    loadSupabaseVideo();
  }, [
    currentSubmission?.id,
    currentSubmission?.audio_bucket,
    currentSubmission?.audio_file_path,
    supabaseMediaUrl,
    loadingSupabaseVideo,
  ]);

  // Reset video URL when submission changes
  useEffect(() => {
    setSupabaseMediaUrl(null);
  }, [currentSubmission?.id]);

  // Determine video playback source
  const getVideoSource = (): VideoSource => {
    const muxMetadata = currentSubmission?.mux_metadata;
    console.log("currentSubmission", currentSubmission);

    // Try Mux first
    if (muxMetadata) {
      if (muxMetadata.status === "ready" && muxMetadata.playback_id) {
        return { type: "mux", playbackId: muxMetadata.playback_id };
      } else if (!muxMetadata.playback_id && muxMetadata.status !== "errored") {
        return { type: "preparing" };
      }
      // If errored, fall through to Supabase
    }

    // Fallback to Supabase
    if (currentSubmission?.audio_bucket && currentSubmission?.audio_file_path) {
      if (loadingSupabaseVideo) {
        return { type: "loading" };
      }
      if (supabaseMediaUrl) {
        return {
          type: "supabase",
          url: supabaseMediaUrl,
          isAudio: isAudioFile(currentSubmission.audio_file_path),
        };
      }
    }

    return null;
  };

  // Early return if no submission
  if (!currentSubmission) {
    return null;
  }

  const videoSource = getVideoSource();

  // Don't render anything if there's no video source
  if (!videoSource) {
    return null;
  }

  return (
    <div className="flex-1">
      {videoSource.type === "mux" && (
        <MuxPlayer
          playbackId={videoSource.playbackId}
          className="w-full rounded-lg"
        />
      )}
      {videoSource.type === "supabase" && (
        <>
          {videoSource.isAudio ? (
            <audio
              src={videoSource.url}
              controls
              className="w-full rounded-lg"
            />
          ) : (
            <video
              src={videoSource.url}
              controls
              className="w-full rounded-lg aspect-video"
            />
          )}
        </>
      )}
      {videoSource.type === "preparing" && (
        <div className="w-full flex flex-col items-center justify-center h-48 text-muted-foreground text-center bg-muted rounded-lg">
          <div className="relative w-8 h-8 mb-4">
            <div className="absolute inset-0 border-2 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-base font-medium">
            {t("processingMessage")}
          </span>
        </div>
      )}
      {videoSource.type === "loading" && (
        <div className="w-full flex items-center justify-center h-48 text-muted-foreground">
          <div className="relative w-8 h-8 mr-2">
            <div className="absolute inset-0 border-2 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          {t("loadingMessage")}
        </div>
      )}
    </div>
  );
}
