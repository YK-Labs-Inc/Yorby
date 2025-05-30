"use client";

import { useState, useRef, useEffect } from "react";
import {
  MonitorUp,
  Loader2,
  Settings2,
  HelpCircle,
  ChevronDown,
  Monitor,
  Chrome,
  Mic,
  MicOff,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { detectQuestions } from "../actions";
import { useDeepgram } from "@/context/DeepgramContext";
import {
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
  SOCKET_STATES,
} from "@deepgram/sdk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { uploadFile } from "@/utils/storage";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsChrome } from "@/hooks/use-chrome";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import { H3 } from "@/components/typography";

// Freemium experience constants
const FREEMIUM_QUESTION_LIMIT = 3;

const MicrophonePermission = ({
  onPermissionGranted,
}: {
  onPermissionGranted: () => void;
}) => {
  const [permissionStatus, setPermissionStatus] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const [isChecking, setIsChecking] = useState(true);
  const t = useTranslations("interviewCopilots.session");

  const checkMicrophonePermission = async () => {
    try {
      // Check if the browser supports permissions API
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        if (result.state === "granted") {
          onPermissionGranted();
        } else {
          setPermissionStatus(result.state as "prompt" | "granted" | "denied");

          // Listen for permission changes
          result.addEventListener("change", () => {
            setPermissionStatus(
              result.state as "prompt" | "granted" | "denied"
            );
            if (result.state === "granted") {
              onPermissionGranted();
            }
          });
        }
      } else {
        // Fallback to getUserMedia check
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          stream.getTracks().forEach((track) => track.stop());
          setPermissionStatus("granted");
          onPermissionGranted();
        } catch {
          setPermissionStatus("denied");
        }
      }
    } catch (error) {
      setPermissionStatus("denied");
    } finally {
      setIsChecking(false);
    }
  };

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionStatus("granted");
      onPermissionGranted();
    } catch (error) {
      setPermissionStatus("denied");
    }
  };

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  if (isChecking) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg">{t("microphonePermission.checking")}</p>
      </div>
    );
  }

  if (permissionStatus === "granted") {
    return null;
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="rounded-full bg-red-100 p-4">
        {permissionStatus === "denied" ? (
          <MicOff className="h-8 w-8 text-red-600" />
        ) : (
          <Mic className="h-8 w-8 text-primary" />
        )}
      </div>
      <h2 className="text-2xl font-semibold">
        {t("microphonePermission.title")}
      </h2>
      <p className="text-muted-foreground max-w-md">
        {permissionStatus === "denied"
          ? t("microphonePermission.description.denied")
          : t("microphonePermission.description.prompt")}
      </p>
      {permissionStatus === "prompt" && (
        <Button
          onClick={requestPermission}
          className="flex items-center space-x-2"
        >
          <Mic className="h-4 w-4" />
          <span>{t("microphonePermission.allowButton")}</span>
        </Button>
      )}
      {permissionStatus === "denied" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t("microphonePermission.instructions.title")}
          </p>
          <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
            <li>{t("microphonePermission.instructions.steps.1")}</li>
            <li>{t("microphonePermission.instructions.steps.2")}</li>
            <li>{t("microphonePermission.instructions.steps.3")}</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export function Session({
  interviewCopilotId,
  isFreemiumExperience,
}: {
  interviewCopilotId: string;
  isFreemiumExperience: boolean;
}) {
  const isMobile = useIsMobile();
  const isChrome = useIsChrome();
  const t = useTranslations("interviewCopilots.session");
  const [microphonePermissionGranted, setMicrophonePermissionGranted] =
    useState(false);
  const [isSelectingMeeting, setIsSelectingMeeting] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTranscriptionService, setLoadingTranscriptionService] =
    useState(false);
  const [transcript, setTranscript] = useState<string[][]>([[]]);
  const contextBufferAmount = 2;
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState<
    {
      question: string;
      answer: string;
    }[]
  >([]);
  const latestQuestionsWithAnswersRef = useRef(questionsWithAnswers);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const copilotRef = useRef<HTMLDivElement>(null);
  const { logError, logInfo } = useAxiomLogging();
  const transcriptIndexRef = useRef(0);
  const previousStartRef = useRef<number | null>(null);
  const latestTranscriptRef = useRef<string[][]>(transcript);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const responseFormat = useRef<"verbatim" | "bullet">("verbatim");
  const [responseFormatState, setResponseFormatState] = useState<
    "verbatim" | "bullet"
  >("verbatim");
  const {
    connection,
    connectToDeepgram,
    connectionState,
    disconnectFromDeepgram,
  } = useDeepgram();
  const keepAliveInterval = useRef<NodeJS.Timeout | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const recordedChunksRef = useRef<Blob[]>([]);
  const router = useRouter();
  const [transcriptAutoScroll, setTranscriptAutoScroll] = useState(true);
  const [copilotAutoScroll, setCopilotAutoScroll] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showExitWarningModal, setShowExitWarningModal] = useState(false);
  const posthog = usePostHog();

  // Onboarding modal states
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState<
    "zoom" | "teams" | "meet" | null
  >(null);
  const [zoomImage, setZoomImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [remainingQuestions, setRemainingQuestions] = useState(
    FREEMIUM_QUESTION_LIMIT
  );
  const remainingQuestionsRef = useRef(remainingQuestions);

  useEffect(() => {
    remainingQuestionsRef.current = remainingQuestions;
  }, [remainingQuestions]);

  const totalSteps = 3;

  const SCROLL_THRESHOLD_PX = 200;
  const [showTranscriptScrollButton, setShowTranscriptScrollButton] =
    useState(false);
  const [showCopilotScrollButton, setShowCopilotScrollButton] = useState(false);
  const [selectedMicrophone, setSelectedMicrophone] =
    useState<MediaDeviceInfo | null>(null);
  const [availableMicrophones, setAvailableMicrophones] = useState<
    MediaDeviceInfo[]
  >([]);
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(
    null
  );

  // Scroll to bottom button component
  const ScrollToBottomButton = ({ onClick }: { onClick: () => void }) => (
    <div className="sticky bottom-0 left-0 right-0 pb-4 flex justify-center pointer-events-none bg-gradient-to-t from-white/80 dark:from-gray-900/80 to-transparent pt-6">
      <Button
        size="icon"
        className="rounded-full shadow-md pointer-events-auto"
        onClick={onClick}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {t("onboarding.steps.1.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("onboarding.steps.1.description")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("onboarding.steps.1.description2")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("onboarding.steps.1.description3")}
            </p>
            <div className="grid gap-4 pt-4">
              <RadioGroup
                value={selectedPlatform || ""}
                onValueChange={(value) =>
                  setSelectedPlatform(value as "zoom" | "teams" | "meet")
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="zoom" id="zoom" />
                  <Label htmlFor="zoom">
                    {t("onboarding.steps.1.platforms.zoom.name")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="teams" id="teams" />
                  <Label htmlFor="teams">
                    {t("onboarding.steps.1.platforms.teams.name")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="meet" id="meet" />
                  <Label htmlFor="meet">
                    {t("onboarding.steps.1.platforms.meet.name")}
                  </Label>
                </div>
              </RadioGroup>

              {selectedPlatform && (
                <div className="mt-4 rounded-lg border p-4">
                  <div className="space-y-4">
                    {selectedPlatform === "zoom" && (
                      <>
                        <p className="text-sm">
                          {t("onboarding.steps.1.platforms.zoom.instruction")}
                        </p>
                        <img
                          src="/assets/zoom-demo.png"
                          alt={t(
                            "onboarding.steps.1.platforms.zoom.instruction"
                          )}
                          className="rounded-lg border cursor-zoom-in hover:opacity-90 transition-opacity"
                          onClick={() =>
                            setZoomImage({
                              src: "/assets/zoom-demo.png",
                              alt: t(
                                "onboarding.steps.1.platforms.zoom.instruction"
                              ),
                            })
                          }
                        />
                      </>
                    )}
                    {selectedPlatform === "teams" && (
                      <>
                        <p className="text-sm">
                          {t("onboarding.steps.1.platforms.teams.instruction")}
                        </p>
                        <img
                          src="/assets/teams-demo.png"
                          alt={t(
                            "onboarding.steps.1.platforms.teams.instruction"
                          )}
                          className="rounded-lg border cursor-zoom-in hover:opacity-90 transition-opacity"
                          onClick={() =>
                            setZoomImage({
                              src: "/assets/teams-demo.png",
                              alt: t(
                                "onboarding.steps.1.platforms.teams.instruction"
                              ),
                            })
                          }
                        />
                      </>
                    )}
                    {selectedPlatform === "meet" && (
                      <>
                        <p className="text-sm">
                          {t("onboarding.steps.1.platforms.meet.instruction")}
                        </p>
                        <img
                          src="/assets/meet-demo.png"
                          alt={t(
                            "onboarding.steps.1.platforms.meet.instruction"
                          )}
                          className="rounded-lg border cursor-zoom-in hover:opacity-90 transition-opacity"
                          onClick={() =>
                            setZoomImage({
                              src: "/assets/meet-demo.png",
                              alt: t(
                                "onboarding.steps.1.platforms.meet.instruction"
                              ),
                            })
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {t("onboarding.steps.2.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("onboarding.steps.2.description")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("onboarding.steps.2.shareTabInstructions.mustShare")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("onboarding.steps.2.shareTabInstructions.doNotShare")}
            </p>
            <div className="rounded-lg border p-4">
              <video
                src="/assets/share-chrome-tab-demo.mp4"
                controls
                className="w-full rounded-lg"
                poster="/assets/start-interview-copilot-instructions.png"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {t("onboarding.steps.3.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("onboarding.steps.3.description")}
            </p>
            <div className="rounded-lg border p-4">
              <img
                src="/assets/start-interview-copilot-instructions.png"
                alt={t("onboarding.steps.3.title")}
                className="rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity"
                onClick={() =>
                  setZoomImage({
                    src: "/assets/start-interview-copilot-instructions.png",
                    alt: t("onboarding.steps.3.title"),
                  })
                }
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const ImageZoomModal = () => {
    if (!zoomImage) return null;

    return (
      <Dialog open={!!zoomImage} onOpenChange={() => setZoomImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{zoomImage.alt}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full p-6">
            <img
              src={zoomImage.src}
              alt={zoomImage.alt}
              className="w-full h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Handle scroll events for both panels
  const handleScroll = (
    element: HTMLDivElement,
    setShowButton: (show: boolean) => void,
    setShouldAutoScroll: (should: boolean) => void
  ) => {
    const { scrollTop, scrollHeight, clientHeight } = element;
    const distanceFromBottom = scrollHeight - clientHeight - scrollTop;

    if (distanceFromBottom <= SCROLL_THRESHOLD_PX) {
      setShowButton(false);
      setShouldAutoScroll(true);
    } else {
      setShowButton(true);
      setShouldAutoScroll(false);
    }
  };

  // Handle beforeunload event to prevent accidental tab closure during recording
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTranscribing && recordedChunksRef.current.length > 0) {
        // Show browser's native dialog
        e.preventDefault();
        e.returnValue = "";

        // Show our custom modal as well
        setShowExitWarningModal(true);

        return "";
      }
    };

    if (isTranscribing) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isTranscribing]);

  // Scroll to bottom handler
  const scrollToBottom = (
    element: HTMLDivElement | null,
    setShouldAutoScroll: (should: boolean) => void,
    setShowButton: (show: boolean) => void
  ) => {
    if (!element) return;

    element.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth",
    });
    setShouldAutoScroll(true);
    setShowButton(false);
  };

  // Remove the old auto-scroll effect
  useEffect(() => {
    const handleAutoScroll = (
      element: HTMLDivElement | null,
      shouldAutoScroll: boolean
    ) => {
      if (!element || !shouldAutoScroll) return;

      element.scrollTo({
        top: element.scrollHeight,
        behavior: "smooth",
      });
    };

    // Set up scroll event listeners
    const transcriptElement = transcriptRef.current;
    const copilotElement = copilotRef.current;

    const transcriptScrollHandler = () =>
      handleScroll(
        transcriptElement!,
        setShowTranscriptScrollButton,
        setTranscriptAutoScroll
      );

    const copilotScrollHandler = () =>
      handleScroll(
        copilotElement!,
        setShowCopilotScrollButton,
        setCopilotAutoScroll
      );

    if (transcriptElement) {
      transcriptElement.addEventListener("scroll", transcriptScrollHandler);
    }

    if (copilotElement) {
      copilotElement.addEventListener("scroll", copilotScrollHandler);
    }

    // Handle auto-scrolling for both panels
    handleAutoScroll(transcriptRef.current, transcriptAutoScroll);
    handleAutoScroll(copilotRef.current, copilotAutoScroll);

    // Cleanup
    return () => {
      if (transcriptElement) {
        transcriptElement.removeEventListener(
          "scroll",
          transcriptScrollHandler
        );
      }
      if (copilotElement) {
        copilotElement.removeEventListener("scroll", copilotScrollHandler);
      }
    };
  }, [
    transcript,
    questionsWithAnswers,
    transcriptAutoScroll,
    copilotAutoScroll,
  ]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const getMicrophones = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const microphones = devices.filter(
        (device) => device.kind === "audioinput"
      );
      setAvailableMicrophones(microphones);

      // Select the default microphone if available
      const defaultMicrophone = microphones.find(
        (mic) => mic.deviceId === "default"
      );
      if (defaultMicrophone) {
        await handleMicrophoneSelect(defaultMicrophone.deviceId, microphones);
      } else if (microphones.length > 0) {
        await handleMicrophoneSelect(microphones[0].deviceId, microphones);
      } else {
        logError("No microphones found");
        alert("No microphones found");
      }
    } catch (error) {
      logError("Error getting microphones:", { error });
      // Re-throw the error so it can be handled by the caller
      alert("Error getting microphones");
    }
  };

  const handleMicrophoneSelect = async (
    deviceId: string,
    devices?: MediaDeviceInfo[]
  ) => {
    try {
      const selectedDevice = (devices || availableMicrophones).find(
        (mic) => mic.deviceId === deviceId
      );
      if (!selectedDevice) return;

      // Stop any existing microphone stream
      if (microphoneStream) {
        microphoneStream.getTracks().forEach((track) => track.stop());
      }

      // Get new stream for selected microphone
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });

      setMicrophoneStream(newStream);
      setSelectedMicrophone(selectedDevice);
    } catch (error) {
      logError("Error selecting microphone:", { error });
    }
  };

  const handleSelectMeeting = async () => {
    try {
      setIsLoading(true);
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert(t("error.noScreenSharingSupport"));
        setIsLoading(false);
        return;
      }

      if (!selectedMicrophone) {
        alert(t("error.noMicrophoneSelected"));
        setIsLoading(false);
        return;
      }

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const audioTrack = mediaStream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error("No audio track available");
      }

      // Update state first
      setStream(mediaStream);
      setIsSelectingMeeting(false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => {
            logError("Error playing video:", { error: e });
          });
        };

        videoRef.current.onerror = (e) => {
          logError("Video error:", { error: e });
        };
      } else {
        logError("No video element reference available");
      }
    } catch (error) {
      logError("Error selecting meeting:", { error });
      setIsLoading(false);
    }
  };

  const startTranscription = async () => {
    setLoadingTranscriptionService(true);
    setIsTranscribing(false);
    if (!stream) {
      alert(t("error.generic"));
      return;
    }
    try {
      posthog.capture("interview_copilot_started", {
        interviewCopilotId,
      });
      setupDeepgramRealTimeTranscription();
    } catch (error) {
      logError("Error starting transcription:", { error });
      setIsTranscribing(false);
    }
  };

  const setupDeepgramRealTimeTranscription = () => {
    connectToDeepgram({
      model: "nova-3",
      interim_results: true,
      smart_format: true,
      filler_words: true,
      utterance_end_ms: 1000,
    });
  };

  useEffect(() => {
    if (!connection) return;

    const onData = (e: BlobEvent) => {
      // iOS SAFARI FIX:
      // Prevent packetZero from being sent. If sent at size 0, the connection will close.
      if (e.data.size > 0) {
        connection?.send(e.data);
      }
    };

    const onTranscript = (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal, speech_final: speechFinal, start } = data;
      let transcriptText = data.channel.alternatives[0].transcript;

      if (isFinal && transcriptText !== "") {
        setTranscript((prev) => {
          const updated = [...prev];

          // Ensure current paragraph exists
          if (!updated[transcriptIndexRef.current]) {
            updated[transcriptIndexRef.current] = [];
          }

          // Handle sentence updates within the current paragraph
          if (previousStartRef.current !== start) {
            // New start time means new sentence
            updated[transcriptIndexRef.current].push(transcriptText);
          } else {
            // Same start time means update the last sentence
            const currentParagraph = updated[transcriptIndexRef.current];
            if (currentParagraph.length > 0) {
              currentParagraph[currentParagraph.length - 1] = transcriptText;
            } else {
              currentParagraph.push(transcriptText);
            }
          }

          previousStartRef.current = start;
          return updated;
        });
      }
    };

    const onUtteranceEnd = () => {
      // Handle paragraph breaks
      const transcriptIndex = transcriptIndexRef.current;
      transcriptIndexRef.current += 1;
      processTranscript(latestTranscriptRef.current[transcriptIndex]);
      setTranscript((prev) => [...prev, []]);
      previousStartRef.current = null; // Reset start time for new paragraph
    };

    if (stream && connectionState === SOCKET_STATES.open) {
      setLoadingTranscriptionService(false);
      setIsTranscribing(true);
      const mediaRecorder = new MediaRecorder(
        new MediaStream(stream.getAudioTracks())
      );
      mediaRecorder.addEventListener("dataavailable", onData);
      mediaRecorder.start(500);
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
      connection.addListener(
        LiveTranscriptionEvents.UtteranceEnd,
        onUtteranceEnd
      );
    }

    return () => {
      connection.removeListener(
        LiveTranscriptionEvents.Transcript,
        onTranscript
      );
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    };
  }, [connectionState, stream]);

  useEffect(() => {
    if (!connection) return;

    if (connectionState === SOCKET_STATES.open) {
      connection.keepAlive();

      keepAliveInterval.current = setInterval(() => {
        connection.keepAlive();
      }, 10000);
    } else {
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
      }
    }

    return () => {
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
      }
    };
  }, [connectionState]);

  useEffect(() => {
    if (!stream || !microphoneStream) return;

    // Create audio context for mixing
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    // Create gain nodes to control volume
    const screenGain = audioContext.createGain();
    const micGain = audioContext.createGain();

    // Set initial volumes (can be adjusted if needed)
    screenGain.gain.value = 1.0;
    micGain.gain.value = 1.0;

    // Connect screen audio
    const screenAudioTrack = stream.getAudioTracks()[0];
    if (screenAudioTrack) {
      const screenSource = audioContext.createMediaStreamSource(
        new MediaStream([screenAudioTrack])
      );
      screenSource.connect(screenGain).connect(destination);
    }

    // Connect microphone audio
    const micAudioTrack = microphoneStream.getAudioTracks()[0];
    if (micAudioTrack) {
      const micSource = audioContext.createMediaStreamSource(
        new MediaStream([micAudioTrack])
      );
      micSource.connect(micGain).connect(destination);
    }

    // Get video track
    const videoTrack = stream.getVideoTracks()[0];

    // Create final stream with video and mixed audio
    const mixedStream = new MediaStream([
      ...(videoTrack ? [videoTrack] : []),
      ...destination.stream.getAudioTracks(),
    ]);

    const mediaRecorder = new MediaRecorder(mixedStream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current = [...recordedChunksRef.current, event.data];
      }
    };

    mediaRecorder.onstop = async () => {
      // Create and upload the recording
      if (recordedChunksRef.current.length > 0) {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        await handleUpload(blob);
      }
      audioContext.close();
    };

    mediaRecorder.start(1000);
    mediaRecorderRef.current = mediaRecorder;

    return () => {
      mediaRecorder.stop();
      audioContext.close();
    };
  }, [microphoneStream, stream]);

  const handleUpload = async (videoBlob: Blob) => {
    try {
      setIsUploading(true);
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const file = new File([videoBlob], `${interviewCopilotId}.webm`, {
        type: "video/webm",
      });
      const filePath = `${session.user.id}/interview-copilots/${interviewCopilotId}`;

      await uploadFile({
        bucketName: "interview_copilot_recordings",
        filePath,
        file,
        setProgress: setUploadProgress,
        onComplete: async () => {
          // Then update the interview data
          await updateInterviewCopilotData(filePath);
          setIsUploading(false);
        },
        accessToken: session.access_token,
        logError,
        logInfo,
      });
    } catch (error: any) {
      logError("Error uploading interview recording", { error: error.message });
      setIsUploading(false);
    }
  };

  const updateInterviewCopilotData = async (filePath: string) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const now = new Date();
      const formattedDate = now.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });

      // First update the interview copilot main data
      const { error: updateError } = await supabase
        .from("interview_copilots")
        .update({
          title: `${formattedDate}`,
          status: "complete",
          file_path: filePath,
        })
        .eq("id", interviewCopilotId);

      if (updateError) {
        logError("Error updating interview copilot data", {
          error: updateError.message,
        });
        return;
      }

      // Then insert all questions and answers
      const questionsAndAnswersToInsert =
        latestQuestionsWithAnswersRef.current.map((qa) => ({
          interview_copilot_id: interviewCopilotId,
          question: qa.question,
          answer: qa.answer,
        }));

      const { error: insertError } = await supabase
        .from("interview_copilot_questions_and_answers")
        .insert(questionsAndAnswersToInsert);

      if (insertError) {
        logError("Error inserting questions and answers", {
          error: insertError.message,
        });
      }
      router.push(`/dashboard/interview-copilots/${interviewCopilotId}/review`);
    } catch (error: any) {
      logError("Error updating interview copilot data", {
        error: error.message,
      });
    }
  };

  const stopTranscription = async () => {
    try {
      // Clean up media recorder
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      // Close Deepgram transcription service
      if (connection) {
        disconnectFromDeepgram();
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (microphoneStream) {
        microphoneStream.getTracks().forEach((track) => track.stop());
      }
    } catch (error: any) {
      logError("Error stopping transcription", { error: error.message });
    }
  };

  useEffect(() => {
    latestTranscriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    latestQuestionsWithAnswersRef.current = questionsWithAnswers;
  }, [questionsWithAnswers]);

  const processTranscript = async (transcript: string[]) => {
    const questions = await detectQuestionsFromTranscript(transcript);
    questions.forEach((question) => {
      processQuestion(question);
    });
  };

  const detectQuestionsFromTranscript = async (currentParagraph: string[]) => {
    let contextBuffer = "";

    // Get previous paragraphs for context
    if (transcriptIndexRef.current > 0) {
      const startIndex = Math.max(
        0,
        transcriptIndexRef.current - contextBufferAmount
      );

      // Get the previous paragraphs up to the context buffer amount
      const previousParagraphs = latestTranscriptRef.current
        .slice(startIndex, transcriptIndexRef.current)
        .filter((paragraph) => paragraph.length > 0); // Only include non-empty paragraphs

      if (previousParagraphs.length > 0) {
        // Join sentences within each paragraph, then join paragraphs with newlines
        contextBuffer =
          previousParagraphs
            .map((paragraph) => paragraph.join(" "))
            .join("\n") + "\n";
      }
    }

    // Join current paragraph sentences with spaces
    const currentText = currentParagraph.join(" ");
    const textToProcess = contextBuffer + currentText;

    const data = new FormData();
    data.append("transcript", textToProcess);
    latestQuestionsWithAnswersRef.current.forEach((q) => {
      data.append("existingQuestions", q.question);
    });
    data.append("interviewCopilotId", interviewCopilotId);
    const { data: questions } = await detectQuestions(data);
    return questions;
  };

  const processQuestion = async (question: string) => {
    setQuestionsWithAnswers((prev) => [...prev, { question, answer: "" }]);

    try {
      // Get previous questions and answers (excluding the current one that has an empty answer)
      const previousQA = latestQuestionsWithAnswersRef.current
        .filter((qa) => qa.answer)
        .map((qa) => ({
          question: qa.question,
          answer: qa.answer,
        }));

      const response = await fetch("/api/answer-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewCopilotId,
          question,
          responseFormat: responseFormat.current,
          previousQA, // Include previous questions and answers
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const textChunk = new TextDecoder().decode(value);
        accumulatedResponse += textChunk;
        setQuestionsWithAnswers((prev) =>
          prev.map((q) =>
            q.question === question ? { ...q, answer: accumulatedResponse } : q
          )
        );
      }

      // Update remaining questions count for freemium users
      if (isFreemiumExperience) {
        const newRemainingQuestions = remainingQuestionsRef.current - 1;
        setRemainingQuestions(newRemainingQuestions);

        if (newRemainingQuestions <= 0) {
          endFreemiumCopilotSession();
        }
      }
    } catch (error) {
      logError("Error processing question", { error });
      setQuestionsWithAnswers((prev) =>
        prev.filter((q) => q.question !== question)
      );
    }
  };

  const endFreemiumCopilotSession = () => {
    setIsDialogOpen(true);

    if (connection) {
      disconnectFromDeepgram();
    }
  };

  if (isMobile) {
    return (
      <div className="h-full w-full flex flex-col justify-center items-center">
        <MobileWarning />
      </div>
    );
  }

  if (!isChrome) {
    return (
      <div className="h-full w-full flex flex-col justify-center items-center">
        <BrowserWarning />
      </div>
    );
  }

  if (!microphonePermissionGranted) {
    return (
      <MicrophonePermission
        onPermissionGranted={() => {
          setMicrophonePermissionGranted(true);
          getMicrophones();
        }}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <ImageZoomModal />

      {/* Exit Warning Modal */}
      <Dialog
        open={showExitWarningModal}
        onOpenChange={setShowExitWarningModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("exitWarning.title")}</DialogTitle>
            <DialogDescription>
              {t("exitWarning.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 text-sm text-muted-foreground">
            {t("exitWarning.instruction")}
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="destructive"
              onClick={() => {
                stopTranscription();
                setShowExitWarningModal(false);
                setIsDialogOpen(true);
              }}
              disabled={isUploading}
            >
              {t("stopRecording")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {t("controls.transcriptAutoScroll")}
            </span>
            <Button
              variant="outline"
              size="sm"
              className={transcriptAutoScroll ? "bg-blue-50 text-blue-600" : ""}
              onClick={() => setTranscriptAutoScroll(!transcriptAutoScroll)}
            >
              {transcriptAutoScroll ? t("controls.on") : t("controls.off")}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {t("controls.copilotAutoScroll")}
            </span>
            <Button
              variant="outline"
              size="sm"
              className={copilotAutoScroll ? "bg-blue-50 text-blue-600" : ""}
              onClick={() => setCopilotAutoScroll(!copilotAutoScroll)}
            >
              {copilotAutoScroll ? t("controls.on") : t("controls.off")}
            </Button>
          </div>
          <TooltipProvider>
            <Tooltip>
              <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentStep(1)}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <DialogContent className="max-h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>{t("onboarding.title")}</DialogTitle>
                    <DialogDescription>
                      {t("onboarding.description")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 rounded">
                      <div
                        className="h-full bg-blue-600 rounded transition-all duration-300"
                        style={{
                          width: `${(currentStep / totalSteps) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-6 overflow-y-auto flex-1">
                    {renderStepContent()}
                  </div>
                  <DialogFooter className="flex justify-between items-center mt-6 border-t pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => setShowOnboarding(false)}
                    >
                      {t("onboarding.skipButton")}
                    </Button>
                    <div className="flex gap-2">
                      {currentStep > 1 && (
                        <Button
                          variant="outline"
                          onClick={() => setCurrentStep((prev) => prev - 1)}
                        >
                          {t("onboarding.previousButton")}
                        </Button>
                      )}
                      {currentStep < totalSteps ? (
                        <Button
                          onClick={() => setCurrentStep((prev) => prev + 1)}
                          disabled={currentStep === 1 && !selectedPlatform}
                        >
                          {t("onboarding.nextButton")}
                        </Button>
                      ) : (
                        <Button onClick={() => setShowOnboarding(false)}>
                          {t("onboarding.getStartedButton")}
                        </Button>
                      )}
                    </div>
                  </DialogFooter>
                </DialogContent>
                <TooltipContent>
                  <p>{t("onboarding.helpButton")}</p>
                </TooltipContent>
              </Dialog>
            </Tooltip>
          </TooltipProvider>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Interview Copilot Settings</DialogTitle>
                <DialogDescription>
                  Configure how your interview copilot behaves and responds
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Response Format</CardTitle>
                    <CardDescription>
                      Choose how you want the copilot to format its responses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={responseFormatState}
                      onValueChange={(value: "verbatim" | "bullet") => {
                        responseFormat.current = value;
                        setResponseFormatState(value);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="verbatim" id="verbatim" />
                        <Label htmlFor="verbatim" className="flex flex-col">
                          <span className="font-medium">Verbatim</span>
                          <span className="text-sm text-gray-500">
                            Word-for-word responses
                          </span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <RadioGroupItem value="bullet" id="bullet" />
                        <Label htmlFor="bullet" className="flex flex-col">
                          <span className="font-medium">Bullet Points</span>
                          <span className="text-sm text-gray-500">
                            Concise bullet-point format
                          </span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex items-center gap-2">
          <img
            src="/assets/dark-logo.png"
            alt="Perfect Interview"
            className="w-8 h-8 mr-2"
          />
          <H3>Perfect Interview</H3>
          {isTranscribing ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">{t("stopRecording")}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {isFreemiumExperience
                      ? t("freemium.limitReached.title")
                      : t("endInterview")}
                  </DialogTitle>
                  <DialogDescription>
                    {isFreemiumExperience
                      ? t("freemium.limitReached.description", {
                          count: FREEMIUM_QUESTION_LIMIT,
                        })
                      : t("endInterviewConfirmation")}
                  </DialogDescription>
                </DialogHeader>
                {isUploading && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {t("uploading")} ({uploadProgress}%)
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <DialogFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isUploading}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      stopTranscription();
                    }}
                    disabled={isUploading}
                  >
                    {t("confirm")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              onClick={startTranscription}
              disabled={!stream || loadingTranscriptionService}
              className="flex items-center gap-2"
            >
              {loadingTranscriptionService ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("selectMeeting.connecting")}
                </>
              ) : (
                t("startCopilot")
              )}
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 h-[calc(100vh-64px)]">
        <div className="w-1/2 flex flex-col">
          <div className="h-[50vh] bg-black relative flex items-center justify-center">
            <div
              className={`absolute inset-0 flex items-center justify-center ${
                !isSelectingMeeting ? "hidden" : ""
              }`}
            >
              <div className="text-center space-y-6">
                <h2 className="text-white text-xl mb-4">
                  {t("selectMeeting.title")}
                </h2>

                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg space-y-4 max-w-md mx-auto">
                  <div className="text-white text-left">
                    <label className="block text-sm font-medium mb-2">
                      {t("selectMicrophone")}
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                      value={selectedMicrophone?.deviceId || ""}
                      onChange={(e) =>
                        handleMicrophoneSelect(
                          e.target.value,
                          availableMicrophones
                        )
                      }
                    >
                      {availableMicrophones.map((mic) => (
                        <option key={mic.deviceId} value={mic.deviceId}>
                          {mic.label || `Microphone ${mic.deviceId}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={handleSelectMeeting}
                  disabled={isLoading || !selectedMicrophone}
                >
                  <MonitorUp className="mr-2 h-4 w-4" />
                  {isLoading
                    ? t("selectMeeting.connecting")
                    : t("selectMeeting.button")}
                </Button>
              </div>
            </div>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-auto object-contain ${
                isSelectingMeeting ? "hidden" : ""
              }`}
            />
          </div>

          <div className="flex-1 border-t flex flex-col min-h-0">
            <div className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium">{t("transcription.title")}</h2>
                {isTranscribing && (
                  <Badge className="px-4 py-2" variant="destructive">
                    {t("transcription.status.transcribing")}
                  </Badge>
                )}
              </div>
              <div
                ref={transcriptRef}
                className="flex-1 overflow-y-auto min-h-0 px-1 space-y-3"
              >
                <div className="text-gray-600 dark:text-gray-300 text-sm space-y-3">
                  {isTranscribing ? (
                    <div className="space-y-3">
                      {transcript.map(
                        (sentences, paragraphIndex) =>
                          sentences.length > 0 && (
                            <div
                              key={paragraphIndex}
                              className="p-3 bg-gray-50 dark:bg-gray-800 
                              border border-gray-100 dark:border-gray-700 rounded-lg"
                            >
                              {sentences.map((sentence, sentenceIndex) => (
                                <span key={sentenceIndex}>
                                  {sentence}
                                  {sentenceIndex < sentences.length - 1
                                    ? " "
                                    : ""}
                                </span>
                              ))}
                            </div>
                          )
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      {t("selectMeeting.instruction")}
                    </div>
                  )}
                </div>
                {showTranscriptScrollButton && (
                  <ScrollToBottomButton
                    onClick={() =>
                      scrollToBottom(
                        transcriptRef.current,
                        setTranscriptAutoScroll,
                        setShowTranscriptScrollButton
                      )
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-1/2 border-l">
          <div className="h-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">{t("copilot.title")}</h2>
              {isFreemiumExperience && (
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={
                            remainingQuestions > 0 ? "default" : "destructive"
                          }
                          className="px-4 py-2"
                        >
                          {t("freemium.remainingQuestions", {
                            count: remainingQuestions,
                          })}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p>
                          {t("freemium.tooltip.description", {
                            count: FREEMIUM_QUESTION_LIMIT,
                          })}
                        </p>
                        <Link href="/purchase">
                          <Button className="w-full mt-4">
                            {t("freemium.tooltip.upgrade")}
                          </Button>
                        </Link>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              {isTranscribing && (
                <Badge className="px-4 py-2">
                  {t("copilot.status.listening")}
                </Badge>
              )}
            </div>
            <div
              ref={copilotRef}
              className="flex-1 overflow-y-auto px-1 space-y-4"
            >
              {isTranscribing ? (
                <div className="space-y-4">
                  {questionsWithAnswers.map((q, index) => (
                    <div
                      key={index}
                      className="p-4 bg-blue-50 dark:bg-gray-800
                        border border-blue-100 dark:border-gray-700 rounded-lg"
                    >
                      <div className="font-medium text-lg text-gray-900 dark:text-white mb-2">
                        {q.question}
                      </div>
                      {q.answer ? (
                        <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {q.answer}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-600 dark:text-gray-300">
                  {t("copilot.waitingMessage")}
                </div>
              )}
              {showCopilotScrollButton && (
                <ScrollToBottomButton
                  onClick={() =>
                    scrollToBottom(
                      copilotRef.current,
                      setCopilotAutoScroll,
                      setShowCopilotScrollButton
                    )
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MobileWarning = () => {
  const t = useTranslations("interviewCopilots.mobileWarning");
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center gap-4 rounded-lg border bg-card text-card-foreground shadow-sm">
      <Monitor className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">{t("title")}</h2>
      <p className="text-muted-foreground">{t("description")}</p>
    </div>
  );
};

const BrowserWarning = () => {
  const t = useTranslations("interviewCopilots.browserWarning");
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center gap-4 rounded-lg border bg-card text-card-foreground shadow-sm">
      <Chrome className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">{t("title")}</h2>
      <p className="text-muted-foreground">{t("description")}</p>
    </div>
  );
};
