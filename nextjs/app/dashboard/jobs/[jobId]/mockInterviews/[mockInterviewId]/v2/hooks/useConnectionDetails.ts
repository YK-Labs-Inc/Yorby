import { useCallback, useEffect, useState } from "react";
import { ConnectionDetails } from "@/app/api/livekit/connection-details/route";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

interface UseConnectionDetailsProps {
  mockInterviewId: string;
}

export default function useConnectionDetails({
  mockInterviewId,
}: UseConnectionDetailsProps) {
  const { logError } = useAxiomLogging();
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);

  const fetchConnectionDetails = useCallback(() => {
    setConnectionDetails(null);
    fetch(`/api/livekit/connection-details?mockInterviewId=${mockInterviewId}`)
      .then((res) => res.json())
      .then((data) => {
        setConnectionDetails(data);
      })
      .catch((error) => {
        logError("Error fetching connection details", {
          error,
        });
      });
  }, [mockInterviewId, logError]);

  useEffect(() => {
    fetchConnectionDetails();
  }, [fetchConnectionDetails]);

  return {
    connectionDetails,
    refreshConnectionDetails: fetchConnectionDetails,
  };
}
