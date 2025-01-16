import React, { useState, useEffect } from "react";

type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
type TTSModel = "tts-1" | "tts-1-hd";

interface TTSOptions {
  voice?: TTSVoice;
  model?: TTSModel;
}

/**
 * Converts text to speech using OpenAI's TTS API
 * @param text The text to convert to speech
 * @param options Optional configuration for voice and model
 * @returns A tuple containing [audioUrl, cleanup] where audioUrl is a blob URL that can be used in an audio element,
 * and cleanup is a function that should be called to free the blob URL when done
 */
export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<[string, () => void]> {
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        ...options,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate speech");
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Return both the URL and a cleanup function
    return [audioUrl, () => URL.revokeObjectURL(audioUrl)];
  } catch (error) {
    console.error("Text to speech error:", error);
    throw error;
  }
}

/**
 * React hook for using TTS with automatic cleanup
 * @param text The text to convert to speech
 * @param options Optional configuration for voice and model
 * @returns An object containing the audio URL and loading/error states
 */
export function useTTS(text: string | null, options: TTSOptions = {}) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!text) {
      setAudioUrl(null);
      setError(null);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError(null);

    textToSpeech(text, options)
      .then(([url, cleanup]) => {
        if (!mounted) {
          cleanup();
          return;
        }
        setAudioUrl(url);
        // Cleanup when component unmounts or text changes
        return () => {
          cleanup();
          setAudioUrl(null);
        };
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [text, options.voice, options.model]);

  return { audioUrl, isLoading, error };
}
