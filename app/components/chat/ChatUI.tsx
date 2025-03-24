import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Play,
  Square,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { CoreMessage } from "ai";
import { useVoiceRecording } from "@/app/[locale]/dashboard/resumes/components/useVoiceRecording";
import VoiceRecordingOverlay from "@/app/[locale]/dashboard/resumes/components/VoiceRecordingOverlay";
import { useTts } from "@/app/context/TtsContext";
import { VOICE_OPTIONS } from "@/app/types/tts";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

interface ChatUIProps {
  messages: CoreMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isProcessing?: boolean;
  isDisabled?: boolean;
  className?: string;
  showTtsControls?: boolean;
  onTtsPlaybackStart?: () => void;
  onTtsPlaybackEnd?: () => void;
  ttsEndpoint?: string;
  transformTextEndpoint?: string;
}

export function ChatUI({
  messages,
  onSendMessage,
  isProcessing = false,
  isDisabled = false,
  className = "",
}: ChatUIProps) {
  const t = useTranslations("chat");
  const [textInput, setTextInput] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(
    null
  );
  const [generatingAudioIndex, setGeneratingAudioIndex] = useState<
    number | null
  >(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    isTtsEnabled,
    setIsTtsEnabled,
    selectedVoice,
    setSelectedVoice,
    playbackSpeed,
    setPlaybackSpeed,
    stopAudioPlayback,
    speakMessage,
  } = useTts();
  const { logError } = useAxiomLogging();

  const {
    startRecording,
    stopRecording,
    cancelRecording,
    isProcessing: isProcessingVoice,
    audioDevices,
    selectedAudio,
    setSelectedAudio,
  } = useVoiceRecording({
    onTranscription: (transcription: string) => {
      if (transcription.trim()) {
        setTextInput(transcription);
        setIsRecording(false);
      }
    },
    t,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      stopAudioPlayback();
    };
  }, [stopAudioPlayback]);

  // Auto-play first message if TTS is enabled
  useEffect(() => {
    if (
      isTtsEnabled &&
      messages.length > 0 &&
      messages[0].role === "assistant"
    ) {
      handlePlayMessage(messages[0].content as string, 0);
    }
  }, [messages, isTtsEnabled]);

  const handleRecordingToggle = async () => {
    stopAudioPlayback();

    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      try {
        await startRecording();
        setIsRecording(true);
      } catch (error) {
        console.error("Failed to start recording:", error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!textInput.trim() || isProcessing) return;

    const messageToSend = textInput;
    setTextInput("");
    await onSendMessage(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePlayMessage = async (message: string, index: number) => {
    setIsTtsEnabled(true);
    if (playingMessageIndex === index) {
      stopAudioPlayback();
      setPlayingMessageIndex(null);
      return;
    }

    if (playingMessageIndex !== null) {
      stopAudioPlayback();
    }

    try {
      setGeneratingAudioIndex(index);
      setPlayingMessageIndex(index);
      await speakMessage(message, {
        onPlaybackEnd: () => {
          setPlayingMessageIndex(null);
        },
      });
      setGeneratingAudioIndex(null);
    } catch (error) {
      logError("Error playing message:", { error });
      setPlayingMessageIndex(null);
      setGeneratingAudioIndex(null);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1 overflow-y-auto space-y-6 p-4 rounded-xl custom-scrollbar min-h-0">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-sm transition-all duration-300 ${
                  message.role === "user"
                    ? "bg-gray-900 text-white dark:bg-gray-700 transform hover:scale-[1.02]"
                    : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transform hover:scale-[1.02]"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex-grow">
                    {(message as any).isLoading ? (
                      <div className="flex items-center justify-center">
                        <LoadingSpinner variant="muted" />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content as string}
                        </ReactMarkdown>
                        {message.role === "assistant" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex-shrink-0 mt-1"
                            onClick={() =>
                              handlePlayMessage(
                                message.content as string,
                                index
                              )
                            }
                            disabled={generatingAudioIndex !== null}
                          >
                            {generatingAudioIndex === index ? (
                              <LoadingSpinner
                                size="sm"
                                className="text-black dark:text-white"
                              />
                            ) : playingMessageIndex === index ? (
                              <Square className="h-3 w-3 text-black dark:text-white" />
                            ) : (
                              <Play className="h-3 w-3 text-black dark:text-white" />
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="relative transition-all duration-300 hover:transform hover:scale-[1.01] p-4">
        <AnimatePresence>
          {isRecording ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <VoiceRecordingOverlay
                isOpen={true}
                onClose={() => {
                  cancelRecording();
                  setIsRecording(false);
                }}
                onConfirm={() => {
                  stopRecording();
                  setIsRecording(false);
                }}
                audioDevices={audioDevices}
                selectedAudio={selectedAudio}
                onSelectAudio={(deviceId) => setSelectedAudio(deviceId)}
              />
            </motion.div>
          ) : isProcessingVoice ? (
            <div className="w-full p-6 rounded-xl border dark:bg-gray-800/50 dark:border-gray-700 bg-white/50 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800 dark:border-gray-700 dark:border-t-white" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {t("transcribing")}
                </span>
              </div>
            </div>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                placeholder={t("typeYourResponse")}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="resize-none w-full p-4 rounded-xl border bg-white/80 dark:bg-gray-800/80 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 transition-all duration-300 mb-2"
                rows={3}
                disabled={isDisabled || isProcessing || isRecording}
              />
              <div className="flex justify-between items-center space-x-3 px-1">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                    onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                  >
                    {isTtsEnabled ? (
                      <Volume2 className="h-4 w-4 text-gray-500" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                  {isTtsEnabled && (
                    <>
                      <Select
                        value={selectedVoice.voiceId}
                        onValueChange={(value) => {
                          const voice = VOICE_OPTIONS.find(
                            (voice) => voice.voiceId === value
                          );
                          if (voice) {
                            const currentPlayingIndex = playingMessageIndex;
                            const currentMessage =
                              currentPlayingIndex !== null
                                ? messages[currentPlayingIndex]
                                : null;
                            setSelectedVoice(voice);

                            // If there was a message playing, restart it with the new voice
                            if (
                              currentPlayingIndex !== null &&
                              currentMessage
                            ) {
                              handlePlayMessage(
                                currentMessage.content as string,
                                currentPlayingIndex
                              );
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="w-[140px] h-9 rounded-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VOICE_OPTIONS.map((voice) => (
                            <SelectItem
                              key={voice.voiceId}
                              value={voice.voiceId}
                            >
                              {voice.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={String(playbackSpeed)}
                        onValueChange={(value) =>
                          setPlaybackSpeed(parseFloat(value))
                        }
                      >
                        <SelectTrigger className="w-[80px] h-9 rounded-full">
                          <SelectValue placeholder={`${playbackSpeed}x`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.5">0.5x</SelectItem>
                          <SelectItem value="1">1.0x</SelectItem>
                          <SelectItem value="1.5">1.5x</SelectItem>
                          <SelectItem value="2">2.0x</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="secondary"
                    type="button"
                    className="h-9 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-2"
                    onClick={handleRecordingToggle}
                    disabled={isDisabled || isProcessing}
                  >
                    {isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                    {t("voice")}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-center"
                    onClick={handleSendMessage}
                    disabled={
                      isDisabled ||
                      (!textInput.trim() && !isRecording) ||
                      isProcessing
                    }
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
