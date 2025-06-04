"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useTranslations } from "next-intl";

interface MediaDevice {
  deviceId: string;
  label: string;
}

interface MediaDeviceContextType {
  videoDevices: MediaDevice[];
  audioDevices: MediaDevice[];
  selectedVideo: string;
  selectedAudio: string;
  stream: MediaStream | null;
  isRecording: boolean;
  isProcessing: boolean;
  testRecording: Blob | null;
  isInitialized: boolean;
  setSelectedVideo: (deviceId: string) => void;
  setSelectedAudio: (deviceId: string) => void;
  startTestRecording: () => void;
  stopTestRecording: () => void;
  startRecording: ({
    audioRecordingCompletedCallback,
    videoRecordingCompletedCallback,
  }: {
    audioRecordingCompletedCallback?: (audioBlob: Blob[]) => Promise<void>;
    videoRecordingCompletedCallback?: (videoBlob: Blob[]) => Promise<void>;
  }) => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  initializeRecording: () => Promise<{
    audio: string | false;
    video: string | false;
  }>;
}

const MediaDeviceContext = createContext<MediaDeviceContextType | undefined>(
  undefined
);

export const useMediaDevice = () => {
  const context = useContext(MediaDeviceContext);
  if (context === undefined) {
    throw new Error("useMediaDevice must be used within a MediaDeviceProvider");
  }
  return context;
};

interface MediaDeviceProviderProps {
  children: ReactNode;
}

export const MediaDeviceProvider = ({ children }: MediaDeviceProviderProps) => {
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testRecording, setTestRecording] = useState<Blob | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const audioMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const testMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const shouldProcessAudioRef = useRef<boolean>(false);
  const shouldProcessVideoRef = useRef<boolean>(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { logError } = useAxiomLogging();
  const t = useTranslations("chat");

  // Default messages for when translation function isn't provided
  const messages = {
    pleaseSelectAMicrophone:
      t("pleaseSelectAMicrophone") ||
      "Please select a microphone before recording.",
    pleaseSelectACamera:
      t("pleaseSelectACamera") || "Please select a camera before recording.",
    micPermissionError:
      t("micPermissionError") ||
      "Error: Could not access microphone. Please check permissions and try again.",
    cameraPermissionError:
      t("cameraPermissionError") ||
      "Error: Could not access camera. Please check permissions and try again.",
    recordingError:
      t("recordingError") ||
      "Error during recording or transcription. Please try again.",
  };

  const initializeRecording = async (): Promise<{
    audio: string | false;
    video: string | false;
  }> => {
    if (isInitialized) return { audio: selectedAudio, video: selectedVideo };

    try {
      // Request both microphone and camera permissions
      const initialStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      // Stop the initial stream since we'll create a new one with selected devices
      initialStream.getTracks().forEach((track) => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();

      // Get audio devices
      const audios = devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label:
            device.label || `Microphone ${device.deviceId.substring(0, 5)}...`,
        }));

      // Get video devices
      const videos = devices
        .filter((device) => device.kind === "videoinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.substring(0, 5)}...`,
        }));

      setAudioDevices(audios);
      setVideoDevices(videos);

      let selectedAudioDevice = "";
      let selectedVideoDevice = "";

      if (audios.length > 0) {
        selectedAudioDevice = audios[0].deviceId;
        setSelectedAudio(selectedAudioDevice);
      }

      if (videos.length > 0) {
        selectedVideoDevice = videos[0].deviceId;
        setSelectedVideo(selectedVideoDevice);
      }

      setIsInitialized(true);
      return {
        audio: selectedAudioDevice || false,
        video: selectedVideoDevice || false,
      };
    } catch (error) {
      logError("Error getting audio/video devices:", { error });
      alert(messages.micPermissionError);
      return { audio: false, video: false };
    }
  };

  useEffect(() => {
    initializeRecording();

    // Cleanup function for component unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        setStream(null);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function setupStream() {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (selectedVideo && selectedAudio) {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: selectedVideo },
            audio: { deviceId: selectedAudio },
          });
          currentStream = newStream;
          setStream(newStream);
        } catch (error) {
          logError("Error setting up media stream:", { error });
        }
      }
    }

    setupStream();

    // Cleanup function to stop all tracks when component unmounts
    // or when selectedVideo/selectedAudio changes
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        setStream(null);
      }
    };
  }, [selectedVideo, selectedAudio]);

  // Unified startRecording function
  const startRecording = async ({
    audioRecordingCompletedCallback,
    videoRecordingCompletedCallback,
  }: {
    audioRecordingCompletedCallback?: (audioBlob: Blob[]) => Promise<void>;
    videoRecordingCompletedCallback?: (videoBlob: Blob[]) => Promise<void>;
  }) => {
    try {
      // Reset chunks
      audioChunksRef.current = [];
      videoChunksRef.current = [];
      let audioActive = false;
      let videoActive = false;
      let audioStream: MediaStream | null = null;
      let videoStream: MediaStream | null = null;
      let audioDeviceToUse = selectedAudio;
      let videoDeviceToUse = selectedVideo;

      // Start audio-only recording if callback provided
      if (audioRecordingCompletedCallback) {
        shouldProcessAudioRef.current = true;
        audioActive = true;
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: audioDeviceToUse },
        });
        const audioMediaRecorder = new MediaRecorder(audioStream);
        audioMediaRecorderRef.current = audioMediaRecorder;
        audioMediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        audioMediaRecorder.onstop = async () => {
          if (
            shouldProcessAudioRef.current &&
            audioChunksRef.current.length > 0
          ) {
            setIsProcessing(true);
            try {
              await audioRecordingCompletedCallback(audioChunksRef.current);
            } catch (e) {
              logError("Error processing audio:", { error: e });
            }
          }
          audioChunksRef.current = [];
          audioActive = false;
          if (!audioActive && !videoActive) {
            setIsRecording(false);
            setIsProcessing(false);
          }
        };
        audioMediaRecorder.onerror = (event) => {
          logError("MediaRecorder error:", { error: event.error });
          alert(
            "Sorry, something went wrong. Please refresh the page and try again."
          );
          setIsRecording(false);
        };
        audioMediaRecorder.start();
      }

      // Start video+audio recording if callback provided
      if (videoRecordingCompletedCallback) {
        shouldProcessVideoRef.current = true;
        videoActive = true;
        videoStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: audioDeviceToUse },
          video: { deviceId: videoDeviceToUse },
        });
        const videoMediaRecorder = new MediaRecorder(videoStream);
        videoMediaRecorderRef.current = videoMediaRecorder;
        videoMediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoChunksRef.current.push(event.data);
          }
        };
        videoMediaRecorder.onstop = async () => {
          if (
            shouldProcessVideoRef.current &&
            videoChunksRef.current.length > 0
          ) {
            setIsProcessing(true);
            try {
              await videoRecordingCompletedCallback(videoChunksRef.current);
            } catch (e) {
              logError("Error processing video:", { error: e });
            }
          }
          videoChunksRef.current = [];
          videoActive = false;
          if (!audioActive && !videoActive) {
            setIsRecording(false);
            setIsProcessing(false);
          }
        };
        videoMediaRecorder.onerror = (event) => {
          logError("MediaRecorder error:", { error: event.error });
          alert(
            "Sorry, something went wrong. Please refresh the page and try again."
          );
          setIsRecording(false);
        };
        videoMediaRecorder.start();
      }

      // Set isRecording true if either is active
      if (audioRecordingCompletedCallback || videoRecordingCompletedCallback) {
        setIsRecording(true);
      }

      // Save the stream for cleanup
      streamRef.current = videoStream || audioStream;
    } catch (error) {
      logError("Failed to start recording:", { error });
      alert(messages.recordingError);
      setIsRecording(false);
    }
  };

  // Update stopRecording and cancelRecording to handle both recorders
  const stopRecording = async () => {
    try {
      shouldProcessAudioRef.current = true;
      shouldProcessVideoRef.current = true;
      if (
        audioMediaRecorderRef.current &&
        audioMediaRecorderRef.current.state === "recording"
      ) {
        audioMediaRecorderRef.current.stop();
      }
      if (
        videoMediaRecorderRef.current &&
        videoMediaRecorderRef.current.state === "recording"
      ) {
        videoMediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    } catch (error) {
      alert(messages.recordingError);
      setIsProcessing(false);
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    shouldProcessAudioRef.current = false;
    shouldProcessVideoRef.current = false;
    if (
      audioMediaRecorderRef.current &&
      audioMediaRecorderRef.current.state === "recording"
    ) {
      audioMediaRecorderRef.current.stop();
    }
    if (
      videoMediaRecorderRef.current &&
      videoMediaRecorderRef.current.state === "recording"
    ) {
      videoMediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  // Test recording functionality (kept for backward compatibility)
  const startTestRecording = () => {
    if (!stream) return;

    const audioStream = new MediaStream(stream.getAudioTracks());
    const mediaRecorder = new MediaRecorder(audioStream);
    const chunks: BlobPart[] = [];
    setIsRecording(true);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      setTestRecording(blob);
      setIsRecording(false);
    };

    mediaRecorder.start();
    testMediaRecorderRef.current = mediaRecorder;
  };

  const stopTestRecording = () => {
    if (
      testMediaRecorderRef.current &&
      testMediaRecorderRef.current.state === "recording"
    ) {
      testMediaRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    if (testRecording) {
      playTestRecording();
    }
  }, [testRecording]);

  const playTestRecording = async () => {
    if (!testRecording) return;

    const audioElement = new Audio(URL.createObjectURL(testRecording));

    audioElement.onended = () => {
      setTestRecording(null);
      URL.revokeObjectURL(audioElement.src);
    };

    audioElement.play();
  };

  const value = {
    videoDevices,
    audioDevices,
    selectedVideo,
    selectedAudio,
    stream,
    isRecording,
    isProcessing,
    testRecording,
    isInitialized,
    setSelectedVideo,
    setSelectedAudio,
    startTestRecording,
    stopTestRecording,
    startRecording,
    stopRecording,
    cancelRecording,
    initializeRecording,
  };

  return (
    <MediaDeviceContext.Provider value={value}>
      {children}
    </MediaDeviceContext.Provider>
  );
};
