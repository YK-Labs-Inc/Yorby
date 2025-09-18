"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import { motion } from "motion/react";
import {
  LocalUserChoices,
  RoomAudioRenderer,
  RoomContext,
  StartAudio,
} from "@livekit/components-react";
import { Toaster } from "@/components/ui/sonner";
import "@livekit/components-styles";
import "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/livekit-light-theme.css";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useTranslations } from "next-intl";
import { toastAlert } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/alert-toast";
import useConnectionDetails from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/hooks/useConnectionDetails";
import { RealInterviewPreJoin } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/RealInterviewPreJoin";
import { SessionView } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/session-view";
import { usePostHog } from "posthog-js/react";
import { APP_CONFIG_DEFAULTS } from "../dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/app-config";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, Users, Zap, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { isSupportedBrowser } from "@/utils/browser";
import { UnsupportedBrowser } from "@/components/unsupported-browser";

const MotionSessionView = motion.create(SessionView);

export function DemoInterviewComponent() {
  const [isSupported, setIsSupported] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showCompletionUI, setShowCompletionUI] = useState(false);
  const [shouldUseRealtimeMode, setShouldUseRealtimeMode] = useState(true);
  const {
    connectionDetails,
    fetchConnectionDetails,
    refreshConnectionDetails,
    isConnecting: isConnectionDetailsLoading,
  } = useConnectionDetails({
    kind: "demo",
    livekitMode: shouldUseRealtimeMode ? "realtime" : "pipeline",
  });
  const [localUserChoices, setLocalUserChoices] = useState<LocalUserChoices>();
  const { logError } = useAxiomLogging();
  const t = useTranslations("apply.interviews.livekit");
  const posthog = usePostHog();

  useEffect(() => {
    const supported = isSupportedBrowser();
    setIsSupported(supported);
  }, []);

  const endDemoInterview = useCallback(async () => {
    posthog.capture("demo_interview_ended");
    setShowCompletionUI(true);
    return "Demo interview ended";
  }, []);

  useEffect(() => {
    room.registerRpcMethod("endDemoInterview", endDemoInterview);

    return () => {
      room.unregisterRpcMethod("endDemoInterview");
    };
  }, [room, endDemoInterview]);

  useEffect(() => {
    const onMediaDevicesError = (error: Error) => {
      logError("Media devices error", {
        error: error.message,
        errorName: error.name,
      });
      toastAlert({
        title: t("errors.mediaDevices"),
        description: `${error.name}: ${error.message}`,
      });
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    return () => {
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room, refreshConnectionDetails, logError, t]);

  useEffect(() => {
    if (
      sessionStarted &&
      room.state === "disconnected" &&
      connectionDetails &&
      !isConnecting
    ) {
      setIsConnecting(true);
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true, {
          deviceId: localUserChoices?.audioDeviceId,
        }),
        room.localParticipant.setCameraEnabled(true, {
          deviceId: localUserChoices?.videoDeviceId,
        }),
        room.connect(
          connectionDetails.serverUrl,
          connectionDetails.participantToken
        ),
      ])
        .then(() => {
          setIsConnecting(false);
        })
        .catch((error) => {
          setIsConnecting(false);
          setConnectionError(true);
          logError("Failed to connect to LiveKit room", {
            error: error.message,
            errorName: error.name,
            serverUrl: connectionDetails.serverUrl,
          });
          // Don't show toast alert, instead show the connection error UI
        });
    }
  }, [
    room,
    sessionStarted,
    connectionDetails,
    isConnecting,
    localUserChoices,
    t,
  ]);

  // Cleanup effect to disconnect room on unmount
  useEffect(() => {
    return () => {
      if (room.state !== "disconnected") {
        room.disconnect();
      }
    };
  }, [room]);

  if (!isSupported) {
    return <UnsupportedBrowser showBrowserOverride={true} />;
  }

  if (connectionError) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>

                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Demo Currently Unavailable
                  </h2>
                  <p className="text-lg text-gray-600">
                    We're experiencing high demand for our live demo. Our
                    systems are currently at capacity to ensure the best
                    experience for everyone.
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    What you can do instead:
                  </h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">
                        Check back in a few minutes when capacity frees up
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">
                        Sign up for our free ATS to get started immediately
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <a
                        href="https://calendar.app.google/CfX9kBwXifdADN6G8"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-700 font-medium"
                      >
                        Schedule a personalized demo with our team →
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/login">
                    <Button
                      size="lg"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
                    >
                      Start Free
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    No credit card required • Free ATS forever
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!sessionStarted) {
    return (
      <RealInterviewPreJoin
        onSubmit={(values) => {
          setSessionStarted(true);
          setLocalUserChoices(values);
          fetchConnectionDetails();

          // Track interview started and prejoin completed
          posthog.capture("demo_interview_started");
        }}
        shouldUseRealtimeMode={shouldUseRealtimeMode}
        setShouldUseRealtimeMode={setShouldUseRealtimeMode}
        requiresTurnstile={true}
      />
    );
  }

  // Show completion UI when interview is complete
  if (showCompletionUI) {
    return (
      <div className="h-full overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12">
        <motion.div
          className="max-w-4xl w-full mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Success Card */}
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm mb-8">
            <CardContent className="p-12">
              {/* Success Icon & Title */}
              <motion.div
                className="text-center mb-8"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Amazing! You've experienced the future of hiring
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                  You just saw how Yorby's AI interviewer transforms recruiting
                  by giving every candidate a fair chance while saving you hours
                  of screening time.
                </p>

                {/* Primary CTA - Above the fold */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Ready to transform your hiring?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start with our free ATS and add AI interviews when you're
                    ready
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/auth/login">
                      <Button
                        size="lg"
                        className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 transition-all hover:scale-105 shadow-lg"
                      >
                        Start Free
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                  </div>

                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-500">
                      No credit card required • Free ATS forever
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* What You Experienced */}
              <motion.div
                className="bg-gray-50 rounded-xl p-6 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  What just happened behind the scenes:
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs text-blue-600 font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Natural Voice Conversation
                      </p>
                      <p className="text-sm text-gray-600">
                        AI engaged with you naturally, just like a human
                        interviewer
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs text-blue-600 font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Real-time Analysis
                      </p>
                      <p className="text-sm text-gray-600">
                        Every response was analyzed for skills and fit
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs text-blue-600 font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Instant Transcription
                      </p>
                      <p className="text-sm text-gray-600">
                        Full conversation recorded and transcribed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs text-blue-600 font-bold">4</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Smart Scoring
                      </p>
                      <p className="text-sm text-gray-600">
                        Performance ranked against job requirements
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Value Props */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Why companies love Yorby:
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      80% Time Saved
                    </h4>
                    <p className="text-sm text-gray-600">
                      Screen 100 candidates in the time it takes to interview 5
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Fair for Everyone
                    </h4>
                    <p className="text-sm text-gray-600">
                      Every candidate gets the same chance to showcase skills
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
                      <Star className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Find Hidden Gems
                    </h4>
                    <p className="text-sm text-gray-600">
                      Discover great candidates you'd miss with resume screening
                    </p>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-8 text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">100% Open Source</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (isConnectionDetailsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {t("connecting.title")}
              </h2>
              <p className="text-gray-600">{t("connecting.description")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div data-lk-theme="default">
        <RoomContext.Provider value={room}>
          <RoomAudioRenderer />
          <StartAudio label={t("labels.startAudio")} />
          <MotionSessionView
            appConfig={APP_CONFIG_DEFAULTS}
            key="session-view"
            disabled={!sessionStarted}
            sessionStarted={sessionStarted}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.5,
              ease: "linear",
            }}
            realtimeMode={shouldUseRealtimeMode}
          />
        </RoomContext.Provider>

        <Toaster />
      </div>
    </>
  );
}
