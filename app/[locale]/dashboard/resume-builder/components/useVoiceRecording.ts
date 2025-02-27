import { useState, useRef, useEffect } from "react";

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
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Get available audio devices
  useEffect(() => {
    async function getDevices() {
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
              device.label ||
              `Microphone ${device.deviceId.substring(0, 5)}...`,
          }));

        setAudioDevices(audios);
        if (audios.length > 0) {
          setSelectedAudio(audios[0].deviceId);
        }
      } catch (error) {
        console.error("Error getting audio devices:", error);
      }
    }

    getDevices();
  }, []);

  // Start recording audio
  const startRecording = async () => {
    try {
      if (!selectedAudio) {
        alert(messages.pleaseSelectAMicrophone);
        return;
      }

      // Initialize media stream with selected audio device
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedAudio,
        },
      });

      streamRef.current = stream;

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      setAudioChunks([]);

      // Handle data from microphone
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          setAudioChunks([...audioChunks, event.data]);
        }
      };

      // Start recording
      mediaRecorder.start();
    } catch (error) {
      console.error("Failed to start recording:", error);
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
    setAudioChunks([]);
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
    } catch (error) {
      alert(messages.recordingError);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const processAudio = async () => {
      if (audioChunks.length > 0) {
        setIsProcessing(true);

        // Process recorded audio for transcription
        const audioBlob = new Blob(audioChunks, {
          type: "audio/webm",
        });
        const formData = new FormData();
        formData.append("audio", audioBlob);
        formData.append("source", "resume-builder");

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          onTranscription(data.transcription);
        } else {
          throw new Error(`Transcription failed: ${response.status}`);
        }
        setIsProcessing(false);
      }
    };

    processAudio();
  }, [audioChunks]);

  return {
    startRecording,
    stopRecording,
    cancelRecording,
    isProcessing,
    audioDevices,
    selectedAudio,
    setSelectedAudio,
  };
}
