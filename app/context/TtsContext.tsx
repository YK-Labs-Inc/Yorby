import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  SetStateAction,
  Dispatch,
  useEffect,
} from "react";
import { VoiceOption, VOICE_OPTIONS } from "@/app/types/tts";

interface TtsContextType {
  isTtsEnabled: boolean;
  setIsTtsEnabled: Dispatch<SetStateAction<boolean>>;
  selectedVoice: VoiceOption;
  setSelectedVoice: Dispatch<SetStateAction<VoiceOption>>;
  playbackSpeed: number;
  setPlaybackSpeed: Dispatch<SetStateAction<number>>;
  isPlaying: boolean;
  transformText: (
    text: string,
    transformTextEndpoint?: string
  ) => Promise<string>;
  speakMessage: (
    text: string,
    options?: {
      onPlaybackStart?: () => void;
      onPlaybackEnd?: () => void;
      ttsEndpoint?: string;
    }
  ) => Promise<void>;
  stopAudioPlayback: () => void;
}

const TtsContext = createContext<TtsContextType | undefined>(undefined);

interface TtsProviderProps {
  children: ReactNode;
  initialVoice?: VoiceOption;
  initialTtsEnabled?: boolean;
}

export function TtsProvider({
  children,
  initialVoice = VOICE_OPTIONS[0],
  initialTtsEnabled = false,
}: TtsProviderProps) {
  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(initialTtsEnabled);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(initialVoice);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play();
    }
  }, [playbackSpeed]);

  // Add effect to handle voice changes
  useEffect(() => {
    stopAudioPlayback();
  }, [selectedVoice]);

  const stopAudioPlayback = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
    } catch (e) {
      console.error("Error in stopAudioPlayback:", e);
    } finally {
      setIsPlaying(false);
    }
  };

  const transformText = async (
    text: string,
    transformTextEndpoint = "/api/transform-text"
  ): Promise<string> => {
    if (!selectedVoice.speakingStyle) return text;

    try {
      const transformResponse = await fetch(transformTextEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          speakingStyle: selectedVoice.speakingStyle,
        }),
      });

      if (!transformResponse.ok) return text;

      const { transformedText } = await transformResponse.json();
      return transformedText;
    } catch (error) {
      console.error("Text transformation error:", error);
      return text;
    }
  };

  const speakMessage = async (
    text: string,
    {
      onPlaybackStart,
      onPlaybackEnd,
      ttsEndpoint = "/api/tts",
    }: {
      onPlaybackStart?: () => void;
      onPlaybackEnd?: () => void;
      ttsEndpoint?: string;
    } = {}
  ) => {
    if (isPlaying) return;

    try {
      setIsPlaying(true);
      onPlaybackStart?.();

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      audio.playbackRate = playbackSpeed;

      stopAudioPlayback();

      audio.onended = () => {
        setIsPlaying(false);
        onPlaybackEnd?.();
        if (audio.src) {
          URL.revokeObjectURL(audio.src);
        }
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsPlaying(false);
        onPlaybackEnd?.();
        if (audio.src) {
          URL.revokeObjectURL(audio.src);
        }
      };

      const response = await fetch(ttsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceId: selectedVoice.voiceId,
          provider: selectedVoice.provider,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate speech: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      audio.src = url;
      await audio.play();
    } catch (error) {
      console.error("TTS Error:", error);
      setIsPlaying(false);
      onPlaybackEnd?.();
    }
  };

  return (
    <TtsContext.Provider
      value={{
        isTtsEnabled,
        setIsTtsEnabled,
        selectedVoice,
        setSelectedVoice,
        playbackSpeed,
        setPlaybackSpeed,
        isPlaying,
        transformText,
        speakMessage,
        stopAudioPlayback,
      }}
    >
      {children}
    </TtsContext.Provider>
  );
}

export function useTts() {
  const context = useContext(TtsContext);
  if (context === undefined) {
    throw new Error("useTts must be used within a TtsProvider");
  }
  return context;
}
