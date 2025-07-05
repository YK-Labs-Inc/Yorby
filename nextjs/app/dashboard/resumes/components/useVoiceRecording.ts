import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface UseVoiceRecordingProps {
  audioRecordingCompletedCallback?: (audioBlob: Blob[]) => Promise<void>;
  videoRecordingCompletedCallback?: (videoBlob: Blob[]) => Promise<void>; // New callback for video recordings
  t?: (key: string) => string; // Add optional translation function
}

export function useVoiceRecording({
  audioRecordingCompletedCallback,
  videoRecordingCompletedCallback,
}: UseVoiceRecordingProps) {
  const MEDIA_RECORDER_TIMESLICE = 100; // 100ms timeslice for frequent data capture
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [selectedVideo, setSelectedVideo] = useState<string>(""); // New state for video device
  const [audioDevices, setAudioDevices] = useState<
    { deviceId: string; label: string }[]
  >([]);
  const [videoDevices, setVideoDevices] = useState<
    { deviceId: string; label: string }[]
  >([]); // New state for video devices
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [recordingMode, setRecordingMode] = useState<"audio" | "video">(
    "audio",
  ); // Track current recording mode
  const { logError } = useAxiomLogging();
  const shouldProcessAudioRef = useRef<boolean>(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const t = useTranslations("chat");

  // Default messages for when translation function isn't provided
  const messages = {
    pleaseSelectAMicrophone: t("pleaseSelectAMicrophone") ||
      "Please select a microphone before recording.",
    pleaseSelectACamera: t("pleaseSelectACamera") ||
      "Please select a camera before recording.",
    micPermissionError: t("micPermissionError") ||
      "Error: Could not access microphone. Please check permissions and try again.",
    cameraPermissionError: t("cameraPermissionError") ||
      "Error: Could not access camera. Please check permissions and try again.",
    recordingError: t("recordingError") ||
      "Error during recording or transcription. Please try again.",
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get available audio and video devices
  const initializeRecording = async (): Promise<
    { audio: string | false; video: string | false }
  > => {
    if (isInitialized) return { audio: selectedAudio, video: selectedVideo };

    try {
      // Request both microphone and camera permissions
      await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      const devices = await navigator.mediaDevices.enumerateDevices();

      // Get audio devices
      const audios = devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label ||
            `Microphone ${device.deviceId.substring(0, 5)}...`,
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

  // Start recording audio only
  const startAudioRecording = async () => {
    try {
      // Reset audio chunks at the start of recording
      audioChunksRef.current = [];
      setRecordingMode("audio");

      // First initialize recording if not already done
      const initializedDevices = await initializeRecording();
      if (initializedDevices.audio === false) return;

      // Use the device ID returned from initialization or the current selectedAudio
      const deviceToUse = initializedDevices.audio || selectedAudio;

      if (!deviceToUse) {
        alert(messages.pleaseSelectAMicrophone);
        return;
      }

      // Set the flag to true when starting a new recording
      shouldProcessAudioRef.current = true;

      // Initialize media stream with selected audio device only
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceToUse,
        },
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (
          shouldProcessAudioRef.current &&
          audioChunksRef.current.length > 0
        ) {
          try {
            setIsProcessing(true);
            await audioRecordingCompletedCallback?.(audioChunksRef.current);
          } catch (e) {
            logError("Error processing audio:", { error: e });
          } finally {
            setIsProcessing(false);
          }
        }
        // Clear the chunks after processing or when cancelled
        audioChunksRef.current = [];
      };

      mediaRecorder.onerror = (event) => {
        logError("MediaRecorder error:", { error: event.error });
        alert(
          "Sorry, something went wrong. Please refresh the page and try again.",
        );
      };

      // Start recording with minimum reliable timeslice for maximum audio capture frequency
      mediaRecorder.start(MEDIA_RECORDER_TIMESLICE);
    } catch (error) {
      logError("Failed to start audio recording:", { error });
      alert(messages.micPermissionError);
    }
  };

  // Start recording video + audio
  const startVideoRecording = async () => {
    try {
      // Reset audio chunks at the start of recording
      audioChunksRef.current = [];
      setRecordingMode("video");

      // First initialize recording if not already done
      const initializedDevices = await initializeRecording();
      if (
        initializedDevices.audio === false || initializedDevices.video === false
      ) {
        alert(messages.cameraPermissionError);
        return;
      }

      // Use the device IDs returned from initialization or the current selected devices
      const audioDeviceToUse = initializedDevices.audio || selectedAudio;
      const videoDeviceToUse = initializedDevices.video || selectedVideo;

      if (!audioDeviceToUse) {
        alert(messages.pleaseSelectAMicrophone);
        return;
      }

      if (!videoDeviceToUse) {
        alert(messages.pleaseSelectACamera);
        return;
      }

      // Set the flag to true when starting a new recording
      shouldProcessAudioRef.current = true;

      // Initialize media stream with selected audio and video devices
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: audioDeviceToUse,
        },
        video: {
          deviceId: videoDeviceToUse,
        },
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (
          shouldProcessAudioRef.current &&
          audioChunksRef.current.length > 0
        ) {
          try {
            setIsProcessing(true);
            await videoRecordingCompletedCallback?.(audioChunksRef.current); // Use processVideo for video recordings
          } catch (e) {
            logError("Error processing video:", { error: e });
          } finally {
            setIsProcessing(false);
          }
        }
        // Clear the chunks after processing or when cancelled
        audioChunksRef.current = [];
      };

      mediaRecorder.onerror = (event) => {
        logError("MediaRecorder error:", { error: event.error });
        alert(
          "Sorry, something went wrong. Please refresh the page and try again.",
        );
      };

      // Start recording with minimum reliable timeslice for maximum capture frequency
      mediaRecorder.start(MEDIA_RECORDER_TIMESLICE);
    } catch (error) {
      logError("Failed to start video recording:", { error });
      alert(messages.cameraPermissionError);
    }
  };

  const cancelRecording = () => {
    // Set the flag to false to prevent processing
    shouldProcessAudioRef.current = false;

    // Stop the recording without processing
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopRecording = async () => {
    try {
      // Ensure the flag is true when stopping normally
      shouldProcessAudioRef.current = true;

      // Stop media recorder - this will trigger ondataavailable
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop all tracks in the stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    } catch (error) {
      alert(messages.recordingError);
      setIsProcessing(false);
    }
  };

  return {
    startAudioRecording, // New method for audio-only recording
    startVideoRecording, // New method for video+audio recording
    stopRecording, // Existing method works for both
    cancelRecording, // Existing method works for both
    isProcessing,
    audioDevices,
    videoDevices, // New return value
    selectedAudio,
    selectedVideo, // New return value
    setSelectedAudio,
    setSelectedVideo, // New return value
    isInitialized,
    recordingMode, // New return value to track current mode
  };
}
