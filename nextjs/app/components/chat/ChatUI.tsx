import {
  useState,
  useRef,
  useEffect,
  SetStateAction,
  Dispatch,
  useCallback,
} from "react";
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
  Paperclip,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { CoreMessage } from "ai";
import VoiceRecordingOverlay from "@/app/dashboard/resumes/components/VoiceRecordingOverlay";
import { useTts } from "@/app/context/TtsContext";
import { VOICE_OPTIONS } from "@/app/types/tts";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useKnowledgeBase } from "@/app/context/KnowledgeBaseContext";
import Markdown from "react-markdown";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useMediaDevice } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/MediaDeviceContext";

const MAX_INLINE_SIZE = 3.5 * 1024 * 1024; // 3.5MB in bytes

interface ChatUIProps {
  messages: CoreMessage[];
  onSendMessage: (
    message: string,
    files?: File[]
  ) => Promise<{ message: string; index: number } | undefined>;
  isProcessing?: boolean;
  isDisabled?: boolean;
  className?: string;
  showTtsControls?: boolean;
  onTtsPlaybackStart?: () => void;
  onTtsPlaybackEnd?: () => void;
  ttsEndpoint?: string;
  transformTextEndpoint?: string;
  showFileSelector?: boolean;
  videoRecordingCompletedCallback?: (videoBlob: Blob[]) => Promise<void>;
}

export function ChatUI({
  messages,
  onSendMessage,
  isProcessing = false,
  isDisabled = false,
  className = "",
  showFileSelector = false,
  videoRecordingCompletedCallback,
}: ChatUIProps) {
  const t = useTranslations("chat");
  const [textInput, setTextInput] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [generatingAudioIndex, setGeneratingAudioIndex] = useState<
    number | null
  >(null);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isPlaying = useRef<boolean>(false);
  const { updateKnowledgeBase } = useKnowledgeBase();
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processAudio = useCallback(
    async (audioChunks: Blob[]) => {
      if (audioChunks.length === 0) {
        logError("No audio chunks to process");
        return;
      }

      try {
        // Create audio blob
        const audioBlob = new Blob(audioChunks, {
          type: "audio/webm",
        });

        // Get current user and session
        const supabase = createSupabaseBrowserClient();
        if (audioBlob.size < MAX_INLINE_SIZE) {
          const formData = new FormData();
          formData.append("audioFileToTranscribe", audioBlob);
          formData.append("source", "resume-builder");

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            if (response.status === 400) {
              alert(t("recordingError"));
            } else {
              throw new Error(`Transcription failed: ${response.status}`);
            }
          }

          const { transcription } = (await response.json()) as {
            transcription: string;
          };
          if (transcription.trim()) {
            setTextInput(transcription);
            setIsRecording(false);
          }
        } else {
          const filePath = `${crypto.randomUUID()}.webm`;

          // Upload to Supabase storage
          const { error: uploadError } = await supabase.storage
            .from("temp-audio-recordings")
            .upload(filePath, audioBlob);

          if (uploadError) {
            logError("Error uploading audio file:", { error: uploadError });
            return;
          }

          // Send file path to transcription API
          const formData = new FormData();
          formData.append("filePath", filePath);
          formData.append("source", "resume-builder");

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            if (response.status === 400) {
              alert(t("recordingError"));
            } else {
              throw new Error(`Transcription failed: ${response.status}`);
            }
          }

          const { transcription } = (await response.json()) as {
            transcription: string;
          };
          if (transcription.trim()) {
            setTextInput(transcription);
            setIsRecording(false);
          }

          // Clean up - delete the temporary file
          await supabase.storage
            .from("temp-audio-recordings")
            .remove([filePath]);
        }
      } catch (error) {
        logError("Error processing audio:", { error });
      }
    },
    [messages, t]
  );

  const {
    startRecording,
    stopRecording,
    cancelRecording,
    isProcessing: isProcessingVoice,
    audioDevices,
    selectedAudio,
    setSelectedAudio,
  } = useMediaDevice();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      stopAudioPlayback();
    };
  }, [stopAudioPlayback]);

  const handleRecordingToggle = async () => {
    stopAudioPlayback();
    setPlayingMessageIndex(null);
    isPlaying.current = false;

    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      try {
        await startRecording({
          audioRecordingCompletedCallback: processAudio,
          videoRecordingCompletedCallback,
        });
        setIsRecording(true);
      } catch (error) {
        logError("Failed to start recording", { error });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);

    // Validate all files are PDFs
    const invalidFile = files.find((file) => file.type !== "application/pdf");
    if (invalidFile) {
      // You might want to show an error message here
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!textInput.trim() && selectedFiles.length === 0) || isProcessing) {
      return;
    }
    stopAudioPlayback();
    setPlayingMessageIndex(null);
    const messageToSend = textInput;
    setTextInput("");

    // Create the new message array with the user's message
    const newMessages = [
      ...messages,
      { role: "user" as const, content: messageToSend },
    ];

    const sendMessageResponse = await onSendMessage(
      messageToSend,
      selectedFiles
    );

    // Update the knowledge base with the new messages
    void updateKnowledgeBase(newMessages);
    setSelectedFiles([]);
    if (isTtsEnabled && sendMessageResponse) {
      isPlaying.current = true;
      setPlayingMessageIndex(sendMessageResponse.index);
      await speakMessage(sendMessageResponse.message, {
        onPlaybackEnd: () => {
          setPlayingMessageIndex(null);
          isPlaying.current = false;
        },
      });
    }
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
      isPlaying.current = false;
      return;
    }

    if (playingMessageIndex !== null) {
      stopAudioPlayback();
    }

    try {
      setGeneratingAudioIndex(index);
      setPlayingMessageIndex(index);
      isPlaying.current = true;
      await speakMessage(message, {
        onPlaybackEnd: () => {
          setPlayingMessageIndex(null);
          isPlaying.current = false;
        },
      });
      setGeneratingAudioIndex(null);
    } catch (error) {
      logError("Error playing message:", { error });
      setPlayingMessageIndex(null);
      setGeneratingAudioIndex(null);
      isPlaying.current = false;
    }
  };

  // Auto-play first message if TTS is enabled
  useEffect(() => {
    if (
      isTtsEnabled &&
      messages.length === 1 &&
      messages[0].role === "assistant" &&
      !isPlaying.current &&
      messages[0].content
    ) {
      handlePlayMessage(messages[0].content as string, 0);
    }
  }, [messages, isTtsEnabled]);

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
                    ? "bg-primary text-primary-foreground transform hover:scale-[1.02]"
                    : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transform hover:scale-[1.02]"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex-grow">
                    {message.content === "" ? (
                      <div className="flex items-center justify-center">
                        <LoadingSpinner variant="muted" />
                      </div>
                    ) : (
                      <div
                        className={`flex flex-col gap-2 ${message.role === "user" ? "prose-white" : "prose"}`}
                      >
                        <Markdown>{message.content as string}</Markdown>
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

              {/* File attachments section */}
              {selectedFiles.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-row gap-2 overflow-x-auto pb-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 min-w-[180px] max-w-[200px] flex-shrink-0"
                      >
                        <span className="text-sm truncate mr-2">
                          {file.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col space-y-3 px-1">
                {/* Primary Actions Row */}
                <div className="flex items-center justify-between space-x-3">
                  <div className="flex space-x-2">
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
                    {showFileSelector && (
                      <>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          ref={fileInputRef}
                          multiple
                        />
                        <Button
                          variant="secondary"
                          type="button"
                          className="h-9 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-2"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isDisabled || isProcessing}
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-center"
                    onClick={handleSendMessage}
                    disabled={
                      isDisabled ||
                      (!textInput.trim() &&
                        !isRecording &&
                        selectedFiles.length === 0) ||
                      isProcessing
                    }
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* TTS Controls Row */}
                <div className="flex items-center space-x-3 border-t dark:border-gray-700 pt-3">
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
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
