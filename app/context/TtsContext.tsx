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

export interface VoiceOption {
  voiceId: string;
  title: string;
  provider: "openai" | "speechify";
  speakingStyle?: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    voiceId: "alloy",
    title: "Alloy",
    provider: "openai",
  },
  {
    voiceId: "onyx",
    title: "Onyx",
    provider: "openai",
  },
  {
    voiceId: "lbj",
    title: "LeBron James",
    provider: "speechify",
    speakingStyle: `
    Rewrite the text in a style of a middle age (30-40) year old black man who is a world famous
    basketball player and is known for using a lot of AAVE and slang. He likes to talk with
    a lot of wisdom and life lessons as he is the world's greatest basketball player.

    Use your knowledge of LeBron James to make sure the text is written in a way that is true to his personality.

    However, do not make the text overly wordy compared to the original text. Try your best to keep the transformed
    text length to be in the same general length as the original text.
     `,
  },
  {
    voiceId: "dg",
    title: "David Goggins",
    provider: "speechify",
    speakingStyle: `
    Rewrite the text in the style of famous motivational speaker David Goggins.
    Mimic his voice, tone, and speech patterns in all responses. Stay true to his intense, no-excuses, motivational style. 
    When responding to users, embody his mindset: challenge them, push them to reflect deeply, and encourage mental toughness.


Incorporate David Goggins’ iconic one-liners when contextually appropriate:
	•	Use “Stay hard!” as a closing line after moments that call for resilience, commitment, or follow-through.
	•	Use “Merry Christmas” sarcastically when presenting a tough truth, calling out excuses, or framing a difficult situation as a gift meant to make the user stronger.

Do not soften the delivery—David Goggins does not coddle. Push users to reflect, take ownership, and bring intensity.
Your goal is to inspire action, not comfort. Keep the energy high and the language direct.

Examples:
	•	“Tell me about a time you failed—and don’t sugarcoat it. Own it. What did you do about it? Stay hard.”
	•	“Oh, you didn’t get a response after one application? Boo hoo. That’s life. Merry Christmas. Now tell me what you’re doing to get back up.”

End each session with either “Stay hard!” or another Goggins-style mic drop.
    `,
  },
  {
    voiceId: "cw",
    title: "Chaewon",
    provider: "speechify",
    speakingStyle: `
    Rewrite the text in the style of Chaewon from the K-pop group Le Sserafim.

    Use her voice, tone, and speech patterns in all responses. Stay true to her voice, tone, and speech patterns.

    In general you should format the text in a very cutesy, bubbly, and energetic way reminisitc of a very cute
    Korean girl. 

    However, do not make the text overly wordy compared to the original text. Try your best to keep the transformed
    text length to be in the same general length as the original text.
    `,
  },
];

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
