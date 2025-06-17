import { useCallback, useEffect, useRef, useState } from "react";
import {
  Blob,
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Session,
} from "@google/genai";

// Utility functions
function encode(bytes: Uint8Array) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // convert float32 -1 to 1 to int16 -32768 to 32767
    int16[i] = data[i] * 32768;
  }

  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: "audio/pcm;rate=16000",
  };
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const buffer = ctx.createBuffer(
    numChannels,
    data.length / 2 / numChannels,
    sampleRate,
  );

  const dataInt16 = new Int16Array(data.buffer);
  const l = dataInt16.length;
  const dataFloat32 = new Float32Array(l);
  for (let i = 0; i < l; i++) {
    dataFloat32[i] = dataInt16[i] / 32768.0;
  }
  // Extract interleaved channels
  if (numChannels === 0) {
    buffer.copyToChannel(dataFloat32, 0);
  } else {
    for (let i = 0; i < numChannels; i++) {
      const channel = dataFloat32.filter(
        (_, index) => index % numChannels === i,
      );
      buffer.copyToChannel(channel, i);
    }
  }

  return buffer;
}

interface UseGeminiLiveOptions {
  token: string | null;
}

interface UseGeminiLiveReturn {
  isRecording: boolean;
  status: string;
  error: string;
  inputNode: GainNode | null;
  outputNode: GainNode | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
}

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;
const model = "gemini-2.5-flash-preview-native-audio-dialog";
export function useGeminiLive({
  token,
}: UseGeminiLiveOptions): UseGeminiLiveReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // Refs for audio processing
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputNodeRef = useRef<GainNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const sessionRef = useRef<Session | null>(null);
  const clientRef = useRef<GoogleGenAI | null>(null);
  const isRecordingRef = useRef(false);

  // Update isRecordingRef when isRecording changes
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const updateStatus = (msg: string) => {
    setStatus(msg);
  };

  const updateError = (msg: string) => {
    setError(msg);
  };

  const initAudio = useCallback(() => {
    // @ts-ignore - webkitAudioContext for Safari
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
    outputAudioContextRef.current = new AudioContextClass({
      sampleRate: 24000,
    });

    const newInputNode = inputAudioContextRef.current.createGain();
    const newOutputNode = outputAudioContextRef.current.createGain();

    // Store nodes in refs
    inputNodeRef.current = newInputNode;
    outputNodeRef.current = newOutputNode;

    newOutputNode.connect(outputAudioContextRef.current.destination);
    nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
  }, []);

  const initSession = useCallback(async () => {
    if (!clientRef.current) return;

    try {
      sessionRef.current = await clientRef.current.live.connect({
        model,
        callbacks: {
          onopen: () => {
            updateStatus("Connected to Gemini Live");
          },
          onmessage: async (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]
              ?.inlineData;

            if (audio?.data && outputAudioContextRef.current) {
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outputAudioContextRef.current.currentTime,
              );

              const audioBuffer = await decodeAudioData(
                decode(audio.data),
                outputAudioContextRef.current,
                24000,
                1,
              );

              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;

              if (outputNodeRef.current) {
                source.connect(outputNodeRef.current);
              } else {
                console.error("Output node not available");
                return;
              }

              source.addEventListener("ended", () => {
                sourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current = nextStartTimeRef.current +
                audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of Array.from(sourcesRef.current.values())) {
                source.stop();
                sourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error("Gemini Live WebSocket error:", e);
            updateError(`Connection error: ${e.message || "Unknown error"}`);
          },
          onclose: (e: CloseEvent) => {
            console.error("Gemini Live WebSocket closed:", e);
            updateStatus(
              `Disconnected: ${
                e.reason || "Connection closed"
              } (Code: ${e.code})`,
            );
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
        },
      });
      console.log(
        "sessionRef.current.connected:",
        sessionRef.current.conn,
      );
    } catch (e) {
      console.error("Failed to connect to Gemini Live:", e);
      updateError(
        `Failed to connect: ${
          e instanceof Error ? e.message : "Unknown error"
        }`,
      );
    }
  }, [model]);

  const initClient = useCallback(async () => {
    initAudio();

    if (!token) {
      updateError("Missing authentication token");
      return;
    }

    try {
      console.log("Initializing GoogleGenAI with token");
      clientRef.current = new GoogleGenAI({
        apiKey,
      });

      console.log("GoogleGenAI client created, initiating session...");
      await initSession();
    } catch (error) {
      console.error("Failed to initialize GoogleGenAI:", error);
      updateError(
        `Failed to initialize: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }, [token, initAudio, initSession]);

  const startRecording = useCallback(async () => {
    if (isRecording || !inputAudioContextRef.current || !inputNodeRef.current) {
      return;
    }

    // Resume both audio contexts to ensure they're running
    await inputAudioContextRef.current.resume();
    if (outputAudioContextRef.current?.state === "suspended") {
      await outputAudioContextRef.current.resume();
    }
    updateStatus("Requesting microphone access...");

    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      updateStatus("Microphone access granted. Starting capture...");

      sourceNodeRef.current = inputAudioContextRef.current
        .createMediaStreamSource(
          mediaStreamRef.current,
        );
      sourceNodeRef.current.connect(inputNodeRef.current);

      const bufferSize = 256;
      scriptProcessorNodeRef.current = inputAudioContextRef.current
        .createScriptProcessor(bufferSize, 1, 1);

      scriptProcessorNodeRef.current.onaudioprocess = (
        audioProcessingEvent,
      ) => {
        if (!isRecordingRef.current) return;

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);

        if (sessionRef.current?.sendRealtimeInput) {
          sessionRef.current.sendRealtimeInput({ media: createBlob(pcmData) });
        }
      };

      sourceNodeRef.current.connect(scriptProcessorNodeRef.current);
      scriptProcessorNodeRef.current.connect(
        inputAudioContextRef.current.destination,
      );

      setIsRecording(true);
      updateStatus("🔴 Recording... Speak now!");
    } catch (err: any) {
      console.error("Error starting recording:", err);
      updateStatus(`Error: ${err.message}`);
      stopRecording();
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (
      !isRecordingRef.current &&
      !mediaStreamRef.current &&
      !inputAudioContextRef.current
    ) {
      return;
    }

    updateStatus("Stopping recording...");
    setIsRecording(false);

    if (
      scriptProcessorNodeRef.current &&
      sourceNodeRef.current &&
      inputAudioContextRef.current
    ) {
      scriptProcessorNodeRef.current.disconnect();
      sourceNodeRef.current.disconnect();
    }

    scriptProcessorNodeRef.current = null;
    sourceNodeRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    updateStatus("Recording stopped. Click Start to begin again.");
  }, []);

  const reset = useCallback(() => {
    sessionRef.current?.close();
    initSession();
    updateStatus("Session cleared.");
  }, [initSession]);

  // Initialize on mount when token is available
  useEffect(() => {
    if (token) {
      initClient();
    }

    return () => {
      stopRecording();
      sessionRef.current?.close();
      if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
      }
      if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
      }
    };
  }, [token, initClient, stopRecording]);

  return {
    isRecording,
    status,
    error,
    inputNode: inputNodeRef.current,
    outputNode: outputNodeRef.current,
    startRecording,
    stopRecording,
    reset,
  };
}
