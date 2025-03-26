import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useState, useRef } from "react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

const MAX_INLINE_SIZE = 3.5 * 1024 * 1024; // 3.5MB in bytes
interface UseVoiceRecordingProps {
  onTranscription: (transcription: string) => void;
  t?: (key: string) => string; // Add optional translation function
}

export function useVoiceRecording({
  onTranscription,
  t,
}: UseVoiceRecordingProps) {
  const MEDIA_RECORDER_TIMESLICE = 100; // 100ms timeslice for frequent data capture
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [audioDevices, setAudioDevices] = useState<
    { deviceId: string; label: string }[]
  >([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { logError } = useAxiomLogging();
  const shouldProcessAudioRef = useRef<boolean>(false);
  const audioChunksRef = useRef<Blob[]>([]);

  // Default messages for when translation function isn't provided
  const messages = {
    pleaseSelectAMicrophone:
      t?.("pleaseSelectAMicrophone") ||
      "Please select a microphone before recording.",
    micPermissionError:
      t?.("micPermissionError") ||
      "Error: Could not access microphone. Please check permissions and try again.",
    recordingError:
      t?.("recordingError") ||
      "Error during recording or transcription. Please try again.",
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get available audio devices - but don't run automatically on mount
  const initializeRecording = async (): Promise<string | false> => {
    if (isInitialized) return selectedAudio;

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const devices = await navigator.mediaDevices.enumerateDevices();

      const audios = devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label:
            device.label || `Microphone ${device.deviceId.substring(0, 5)}...`,
        }));

      setAudioDevices(audios);

      let selectedDevice = "";
      if (audios.length > 0) {
        selectedDevice = audios[0].deviceId;
        setSelectedAudio(selectedDevice);
      }

      setIsInitialized(true);
      return selectedDevice || false;
    } catch (error) {
      logError("Error getting audio devices:", { error });
      alert(messages.micPermissionError);
      return false;
    }
  };

  const processAudio = async (audioChunks: Blob[]) => {
    if (audioChunks.length === 0) {
      logError("No audio chunks to process");
      return;
    }

    setIsProcessing(true);

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
            alert(messages.recordingError);
          } else {
            throw new Error(`Transcription failed: ${response.status}`);
          }
        }

        const { transcription } = (await response.json()) as {
          transcription: string;
        };
        onTranscription(transcription);
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
            alert(messages.recordingError);
          } else {
            throw new Error(`Transcription failed: ${response.status}`);
          }
        }

        const { transcription } = (await response.json()) as {
          transcription: string;
        };
        onTranscription(transcription);

        // Clean up - delete the temporary file
        await supabase.storage.from("temp-audio-recordings").remove([filePath]);
      }
    } catch (error) {
      logError("Error processing audio:", { error });
    } finally {
      setIsProcessing(false);
    }
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      // Reset audio chunks at the start of recording
      audioChunksRef.current = [];

      // First initialize recording if not already done
      const initializedAudioDevice = await initializeRecording();
      if (initializedAudioDevice === false) return;

      // Use the device ID returned from initialization or the current selectedAudio
      const deviceToUse = initializedAudioDevice || selectedAudio;

      if (!deviceToUse) {
        alert(messages.pleaseSelectAMicrophone);
        return;
      }

      // Set the flag to true when starting a new recording
      shouldProcessAudioRef.current = true;

      // Initialize media stream with selected audio device
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
          await processAudio(audioChunksRef.current);
        }
        // Clear the chunks after processing or when cancelled
        audioChunksRef.current = [];
      };

      mediaRecorder.onerror = (event) => {
        logError("MediaRecorder error:", { error: event.error });
        alert(
          "Sorry, something went wrong. Please refresh the page and try again."
        );
      };

      // Start recording with minimum reliable timeslice for maximum audio capture frequency
      mediaRecorder.start(MEDIA_RECORDER_TIMESLICE);
    } catch (error) {
      logError("Failed to start recording:", { error });
      alert(messages.micPermissionError);
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
    startRecording,
    stopRecording,
    cancelRecording,
    isProcessing,
    audioDevices,
    selectedAudio,
    setSelectedAudio,
    isInitialized,
  };
}
