import { useCallback, useEffect, useState } from "react";
import { ConnectionDetails } from "@/app/api/livekit/connection-details/route";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

type UseConnectionDetailsProps =
  | { kind: "mock"; id: string }
  | { kind: "candidate"; id: string };

export default function useConnectionDetails(props: UseConnectionDetailsProps) {
  const { logError } = useAxiomLogging();
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);

  const fetchConnectionDetails = useCallback(() => {
    const queryParam =
      props.kind === "mock"
        ? `mockInterviewId=${encodeURIComponent(props.id)}`
        : `candidateJobInterviewId=${encodeURIComponent(props.id)}`;

    setConnectionDetails(null);
    fetch(`/api/livekit/connection-details?${queryParam}`)
      .then((res) => res.json())
      .then((data) => {
        setConnectionDetails(data);
      })
      .catch((error) => {
        logError("Error fetching connection details", {
          error,
        });
      });
  }, [props, logError]);

  return {
    connectionDetails,
    refreshConnectionDetails: fetchConnectionDetails,
    fetchConnectionDetails,
  };
}
