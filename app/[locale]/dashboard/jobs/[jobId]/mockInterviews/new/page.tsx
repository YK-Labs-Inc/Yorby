"use client";

import { use, useActionState, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { startMockInterview } from "./actions";
import { useTranslations } from "next-intl";

interface MediaDevice {
  deviceId: string;
  label: string;
}

export default function NewMockInterviewPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const t = useTranslations("mockInterview.setup");
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDevice[]>(
    []
  );
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isTestingOutput, setIsTestingOutput] = useState(false);
  const [hasStartedInterview, setHasStartedInterview] = useState(false);
  const [mockInterviewId, setMockInterviewId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [startInterviewState, startInterviewAction, startInterviewIsPending] =
    useActionState(startMockInterview, {
      error: "",
      success: false,
      mockInterviewId: null,
    });

  useEffect(() => {
    if (startInterviewState.success && startInterviewState.mockInterviewId) {
      setHasStartedInterview(true);
      setMockInterviewId(startInterviewState.mockInterviewId);
    }
    if (startInterviewState.error) {
      alert(startInterviewState.error);
    }
  }, [startInterviewState]);

  useEffect(() => {
    // Get available media devices
    async function getDevices() {
      try {
        // Request permission to access devices
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();

        const videos = devices
          .filter((device) => device.kind === "videoinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label,
          }));
        const audios = devices
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label,
          }));
        const audioOutputs = devices
          .filter((device) => device.kind === "audiooutput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label,
          }));

        setVideoDevices(videos);
        setAudioDevices(audios);
        setAudioOutputDevices(audioOutputs);

        if (videos.length > 0) setSelectedVideo(videos[0].deviceId);
        if (audios.length > 0) setSelectedAudio(audios[0].deviceId);
        if (audioOutputs.length > 0)
          setSelectedAudioOutput(audioOutputs[0].deviceId);
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    }

    getDevices();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
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

          setStream(newStream);

          if (videoRef.current) {
            videoRef.current.srcObject = newStream;
          }

          // Setup audio visualization
          setupAudioVisualization(newStream);
        } catch (error) {
          console.error("Error setting up media stream:", error);
        }
      }
    }

    setupStream();
  }, [selectedVideo, selectedAudio]);

  const setupAudioVisualization = (mediaStream: MediaStream) => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(mediaStream);
    microphone.connect(analyser);
    analyser.fftSize = 256;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average =
        dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      setAudioLevel(average);
      requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
    audioContextRef.current = audioContext;
  };

  const testAudioOutput = async () => {
    if (isTestingOutput) return;

    setIsTestingOutput(true);
    try {
      const audioElement = new Audio("/assets/testaudio.mp3");

      if ("setSinkId" in audioElement) {
        try {
          // @ts-ignore - TypeScript doesn't recognize setSinkId yet
          await audioElement.setSinkId(selectedAudioOutput);
        } catch (err) {
          console.error("Error setting audio output device:", err);
        }
      }

      audioElement.onended = () => {
        setIsTestingOutput(false);
      };

      await audioElement.play();
    } catch (error) {
      console.error("Error testing audio output:", error);
      setIsTestingOutput(false);
    }
  };

  if (!hasStartedInterview) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Label htmlFor="camera">{t("camera.label")}</Label>
                <select
                  id="camera"
                  value={selectedVideo}
                  onChange={(e) => setSelectedVideo(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {videoDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>

                <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Label htmlFor="microphone">{t("microphone.label")}</Label>
                  <select
                    id="microphone"
                    value={selectedAudio}
                    onChange={(e) => setSelectedAudio(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4">
                    <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-100"
                        style={{ width: `${(audioLevel / 255) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Label htmlFor="speakers">{t("speakers.label")}</Label>
                  <select
                    id="speakers"
                    value={selectedAudioOutput}
                    onChange={(e) => setSelectedAudioOutput(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {audioOutputDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4">
                    <Button
                      onClick={testAudioOutput}
                      disabled={isTestingOutput}
                    >
                      {isTestingOutput
                        ? t("speakers.testing")
                        : t("speakers.test")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <form action={startInterviewAction}>
            <input type="hidden" name="jobId" value={jobId} />
            <Button
              size="lg"
              disabled={!stream || startInterviewIsPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              {t("startButton")}
            </Button>
          </form>
        </div>
      </div>
    );
  }
}
