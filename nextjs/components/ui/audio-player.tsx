"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Play, Pause, Volume2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

interface AudioPlayerProps {
  bucket: string;
  filePath: string;
  presetDuration?: number; // Optional preset duration (for submissions)
  className?: string;
}

export default function AudioPlayer({
  bucket,
  filePath,
  presetDuration,
  className = "",
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(presetDuration || 0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const t = useTranslations("AudioPlayer");

  useEffect(() => {
    const getAudioUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) {
          setError("Failed to load audio");
          return;
        }

        setAudioUrl(data.signedUrl);
      } catch (err) {
        setError("Failed to load audio");
      } finally {
        setLoading(false);
      }
    };

    if (bucket && filePath) {
      getAudioUrl();
    }
  }, [bucket, filePath]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      // Only update duration from metadata if no preset duration is provided
      if (!presetDuration) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setError("Failed to load audio");
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioUrl, presetDuration]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) {
      return "0:00";
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!bucket || !filePath) {
    return null;
  }

  if (loading) {
    return (
      <div
        className={`flex items-center gap-2 p-3 bg-muted/30 rounded-lg ${className}`}
      >
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {t("loadingAudio")}
        </span>
      </div>
    );
  }

  if (error || !audioUrl) {
    return (
      <div
        className={`flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg ${className}`}
      >
        <Volume2 className="h-4 w-4 text-red-400" />
        <span className="text-sm text-red-600 dark:text-red-400">
          {t("failedToLoadAudio")}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`p-3 bg-muted/30 border border-border/50 rounded-md ${className}`}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlayPause}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>

        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="100"
            value={duration > 0 ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="w-full h-1 bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}
    </div>
  );
}
