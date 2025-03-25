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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [audioDevices, setAudioDevices] = useState<
    { deviceId: string; label: string }[]
  >([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { logError } = useAxiomLogging();

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
  const audioChunksRef = useRef<Blob[]>([]);

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
      audioChunksRef.current = [];
    }
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      // First initialize recording if not already done
      const initializedAudioDevice = await initializeRecording();
      if (initializedAudioDevice === false) return;

      // Use the device ID returned from initialization or the current selectedAudio
      const deviceToUse = initializedAudioDevice || selectedAudio;

      if (!deviceToUse) {
        alert(messages.pleaseSelectAMicrophone);
        return;
      }

      // Initialize media stream with selected audio device
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceToUse,
        },
      });

      streamRef.current = stream;

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      audioChunksRef.current = [];

      // Handle data from microphone
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording with 500ms intervals
      mediaRecorder.start(500);
    } catch (error) {
      logError("Failed to start recording:", { error });
      alert(messages.micPermissionError);
    }
  };

  const cancelRecording = () => {
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

    // Clear audio chunks
    audioChunksRef.current = [];
  };

  const stopRecording = async () => {
    try {
      // Stop media recorder
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

      // Process the audio immediately
      await processAudio(audioChunksRef.current);
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
