import { useCallback, useEffect, useState } from "react";
import { ConnectionDetails } from "@/app/api/livekit/connection-details/route";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

type UseConnectionDetailsProps =
  | { kind: "mock"; id: string; enableAiAvatar?: boolean }
  | { kind: "candidate"; id: string; enableAiAvatar?: boolean };

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
    
    const avatarParam = props.enableAiAvatar !== undefined 
      ? `&enableAiAvatar=${encodeURIComponent(props.enableAiAvatar.toString())}`
      : '';
    
    const queryParam = `${baseParam}${avatarParam}`;

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
