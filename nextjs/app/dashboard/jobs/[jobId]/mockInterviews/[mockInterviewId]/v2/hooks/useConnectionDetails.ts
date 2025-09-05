import { useCallback, useEffect, useState } from "react";
import { ConnectionDetails } from "@/app/api/livekit/connection-details/route";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

type UseConnectionDetailsProps =
  | {
      kind: "mock";
      id: string;
      enableAiAvatar?: boolean;
      avatarProvider?: "bey" | "simli";
      livekitMode?: "realtime" | "pipeline";
    }
  | {
      kind: "candidate";
      id: string;
      enableAiAvatar?: boolean;
      avatarProvider?: "bey" | "simli";
      livekitMode?: "realtime" | "pipeline";
    };

export default function useConnectionDetails(props: UseConnectionDetailsProps) {
  const { logError } = useAxiomLogging();
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const fetchConnectionDetails = useCallback(() => {
    const baseParam =
      props.kind === "mock"
        ? `mockInterviewId=${encodeURIComponent(props.id)}`
        : `candidateJobInterviewId=${encodeURIComponent(props.id)}`;

    const avatarParam =
      props.enableAiAvatar !== undefined
        ? `&enableAiAvatar=${encodeURIComponent(props.enableAiAvatar.toString())}`
        : "";
    const avatarProviderParam =
      props.avatarProvider !== undefined
        ? `&avatarProvider=${encodeURIComponent(props.avatarProvider)}`
        : "";
    const livekitModeParam =
      props.livekitMode !== undefined
        ? `&livekitMode=${encodeURIComponent(props.livekitMode)}`
        : "";

    const queryParam = `${baseParam}${avatarParam}${avatarProviderParam}${livekitModeParam}`;

    setConnectionDetails(null);
    setIsConnecting(true);
    setIsConnected(false);
    fetch(`/api/livekit/connection-details?${queryParam}`)
      .then((res) => res.json())
      .then((data) => {
        setConnectionDetails(data);
        setIsConnecting(false);
        setIsConnected(true);
      })
      .catch((error) => {
        logError("Error fetching connection details", {
          error,
        });
        setIsConnecting(false);
        setIsConnected(false);
      });
  }, [props, logError]);

  return {
    connectionDetails,
    refreshConnectionDetails: fetchConnectionDetails,
    fetchConnectionDetails,
    isConnecting,
    isConnected,
  };
}
