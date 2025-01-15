'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface MediaDevice {
  deviceId: string;
  label: string;
}

export default function NewMockInterviewPage() {
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [selectedAudio, setSelectedAudio] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Get available media devices
    async function getDevices() {
      try {
        // Request permission to access devices
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const videos = devices.filter(device => device.kind === 'videoinput')
          .map(device => ({ deviceId: device.deviceId, label: device.label }));
        const audios = devices.filter(device => device.kind === 'audioinput')
          .map(device => ({ deviceId: device.deviceId, label: device.label }));
        
        setVideoDevices(videos);
        setAudioDevices(audios);
        
        if (videos.length > 0) setSelectedVideo(videos[0].deviceId);
        if (audios.length > 0) setSelectedAudio(audios[0].deviceId);
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    }
    
    getDevices();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    async function setupStream() {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
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
          console.error('Error setting up media stream:', error);
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
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      setAudioLevel(average);
      requestAnimationFrame(updateAudioLevel);
    };
    
    updateAudioLevel();
    audioContextRef.current = audioContext;
  };

  const testAudio = async () => {
    if (!stream) return;
    
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Low volume
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, 1000);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Setup Your Interview Environment</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Label htmlFor="camera">Camera</Label>
              <Select value={selectedVideo} onValueChange={setSelectedVideo}>
                <SelectTrigger id="camera">
                  <SelectValue placeholder="Select a camera" />
                </SelectTrigger>
                <SelectContent>
                  {videoDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
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

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Label htmlFor="microphone">Microphone</Label>
              <Select value={selectedAudio} onValueChange={setSelectedAudio}>
                <SelectTrigger id="microphone">
                  <SelectValue placeholder="Select a microphone" />
                </SelectTrigger>
                <SelectContent>
                  {audioDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-4">
                <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-100"
                    style={{ width: `${(audioLevel / 255) * 100}%` }}
                  />
                </div>
                <Button onClick={testAudio} className="mt-4">
                  Test Audio
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button size="lg" disabled={!stream}>
          Start Interview
        </Button>
      </div>
    </div>
  );
}