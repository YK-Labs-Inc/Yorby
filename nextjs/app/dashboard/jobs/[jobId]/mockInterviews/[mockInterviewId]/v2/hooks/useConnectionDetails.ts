import { useCallback, useEffect, useState } from "react";
import { ConnectionDetails } from "@/app/api/livekit/connection-details/route";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

type UseConnectionDetailsProps = {
  kind: "candidate" | "demo" | "mock";
  id?: string;
  enableAiAvatar?: boolean;
  avatarProvider?: "bey" | "simli";
  livekitMode?: "realtime" | "pipeline";
  simliFaceId?: string;
};

export default function useConnectionDetails(props: UseConnectionDetailsProps) {
  const { logError } = useAxiomLogging();
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const fetchConnectionDetails = useCallback(() => {
    let queryParam = "";
    if (props.kind === "mock" && props.id) {
      queryParam += `mockInterviewId=${encodeURIComponent(props.id)}`;
    } else if (props.kind === "candidate" && props.id) {
      queryParam += `candidateJobInterviewId=${encodeURIComponent(props.id)}`;
    } else if (props.kind === "demo") {
      queryParam += `isDemo=true`;
    } else {
      throw new Error("Invalid kind or id");
    }

    if (props.enableAiAvatar !== undefined) {
      queryParam += `&enableAiAvatar=${encodeURIComponent(props.enableAiAvatar.toString())}`;
    }
    if (props.avatarProvider !== undefined) {
      queryParam += `&avatarProvider=${encodeURIComponent(props.avatarProvider)}`;
    }
    if (props.livekitMode !== undefined) {
      queryParam += `&livekitMode=${encodeURIComponent(props.livekitMode)}`;
    }
    if (props.simliFaceId !== undefined) {
      queryParam += `&simliFaceId=${encodeURIComponent(props.simliFaceId)}`;
    }

    setConnectionDetails(null);
    setIsConnecting(true);
    setIsConnected(false);
    fetch(`https://web.yorby.ai/api/livekit/connection-details?${queryParam}`)
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
