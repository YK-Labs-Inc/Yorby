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
    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ??
        "/api/livekit/connection-details",
      window.location.origin
    );
    url.searchParams.set("mockInterviewId", mockInterviewId);
    fetch(url.toString())
      .then((res) => res.json())
      .then((data) => {
        setConnectionDetails(data);
      })
      .catch((error) => {
        logError("Error fetching connection details", {
          error,
        });
      });
  }, [mockInterviewId]);

  useEffect(() => {
    fetchConnectionDetails();
  }, [fetchConnectionDetails]);

  return {
    connectionDetails,
    refreshConnectionDetails: fetchConnectionDetails,
  };
}
