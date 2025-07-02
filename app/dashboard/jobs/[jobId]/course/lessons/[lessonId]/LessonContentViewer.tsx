"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import MuxPlayer from "@mux/mux-player-react";
import { FileText, AlertCircle, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { LessonBlock } from "./page";

interface LessonContentViewerProps {
  block: LessonBlock;
}

// Video fallback component
function VideoFallback({
  file,
}: {
  file: NonNullable<LessonBlock["course_lesson_files"]>;
}) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getVideoUrl = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.storage
          .from(file.bucket_name)
          .createSignedUrl(file.file_path, 3600);

        if (error) throw error;
        setVideoUrl(data.signedUrl);
      } catch (error) {
        console.error("Error getting video signed URL:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getVideoUrl();
  }, [file]);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
        <p>Loading video...</p>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Video is not available</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video">
      <video controls className="w-full h-full rounded-lg" src={videoUrl}>
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default function LessonContentViewer({
  block,
}: LessonContentViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getSignedUrl = async () => {
      if (!block.course_lesson_files || block.block_type === "video") {
        // Skip for video files as they use Mux or have special handling
        return;
      }

      setIsLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.storage
          .from(block.course_lesson_files.bucket_name)
          .createSignedUrl(block.course_lesson_files.file_path, 3600); // 1 hour expiry

        if (error) throw error;
        setSignedUrl(data.signedUrl);
      } catch (error) {
        console.error("Error getting signed URL:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getSignedUrl();
  }, [block]);

  const renderContent = () => {
    switch (block.block_type) {
      case "text":
        if (!block.text_content) return null;
        return (
          <div className="prose prose-sm max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: block.text_content.replace(/\n/g, "<br />"),
              }}
            />
          </div>
        );

      case "video":
        if (!block.course_lesson_files) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Video content not available</p>
            </div>
          );
        }

        const muxData =
          block.course_lesson_files.course_lesson_files_mux_metadata;
        const playbackId = muxData?.playback_id;
        const status = muxData?.status;
        console.log("muxData", muxData);

        // Use Mux if available and ready
        if (playbackId && status === "ready") {
          return (
            <div className="relative aspect-video">
              <MuxPlayer
                playbackId={playbackId}
                style={{ width: "100%", height: "100%" }}
                streamType="on-demand"
                metadata={{
                  video_id: block.course_lesson_files.id,
                  video_title: block.course_lesson_files.display_name,
                }}
              />
            </div>
          );
        }

        // If Mux is preparing, show processing message
        if (status === "preparing") {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p>Video is being processed...</p>
            </div>
          );
        }

        // Fallback to direct video file for errored or missing Mux
        return <VideoFallback file={block.course_lesson_files} />;

      case "pdf":
        if (!block.course_lesson_files) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>PDF content not available</p>
            </div>
          );
        }

        if (isLoading) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p>Loading PDF...</p>
            </div>
          );
        }

        const pdfUrl = signedUrl || block.course_lesson_files.file_path;

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {block.course_lesson_files.display_name}
                  </p>
                  <p className="text-sm text-muted-foreground">PDF Document</p>
                </div>
              </div>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                Open PDF
              </a>
            </div>
            <iframe
              src={`${pdfUrl}#toolbar=0`}
              className="w-full h-[600px] border rounded-lg"
              title={block.course_lesson_files.display_name}
            />
          </div>
        );

      case "image":
        if (!block.course_lesson_files) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Image content not available</p>
            </div>
          );
        }

        if (isLoading) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p>Loading image...</p>
            </div>
          );
        }

        const imageUrl = signedUrl || block.course_lesson_files.file_path;

        return (
          <div className="space-y-2">
            <div className="relative w-full">
              <img
                src={imageUrl}
                alt={block.course_lesson_files.display_name}
                className="w-full h-auto rounded-lg"
              />
            </div>
            {block.course_lesson_files.display_name && (
              <p className="text-sm text-center text-muted-foreground">
                {block.course_lesson_files.display_name}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const content = renderContent();
  if (!content) return null;

  return (
    <Card>
      <CardContent className="pt-6">{content}</CardContent>
    </Card>
  );
}
