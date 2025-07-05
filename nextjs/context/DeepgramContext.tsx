"use client";

import {
  createClient,
  LiveClient,
  LiveTranscriptionEvents,
  SOCKET_STATES,
  type LiveSchema,
  type LiveTranscriptionEvent,
} from "@deepgram/sdk";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  FunctionComponent,
} from "react";
import { useAxiomLogging } from "./AxiomLoggingContext";
interface DeepgramContextType {
  connection: LiveClient | null;
  connectToDeepgram: (options: LiveSchema, endpoint?: string) => Promise<void>;
  disconnectFromDeepgram: () => void;
  connectionState: SOCKET_STATES;
}

const DeepgramContext = createContext<DeepgramContextType | undefined>(
  undefined
);

interface DeepgramContextProviderProps {
  children: ReactNode;
}

const getApiKey = async (): Promise<string> => {
  const response = await fetch("/api/deepgram/authenticate", {
    cache: "no-store",
  });
  const result = await response.json();
  return result.key;
};

const DeepgramContextProvider: FunctionComponent<
  DeepgramContextProviderProps
> = ({ children }) => {
  const [connection, setConnection] = useState<LiveClient | null>(null);
  const [connectionState, setConnectionState] = useState<SOCKET_STATES>(
    SOCKET_STATES.closed
  );
  const { logError } = useAxiomLogging();

  /**
   * Connects to the Deepgram speech recognition service and sets up a live transcription session.
   *
   * @param options - The configuration options for the live transcription session.
   * @param endpoint - The optional endpoint URL for the Deepgram service.
   * @returns A Promise that resolves when the connection is established.
   */
  const connectToDeepgram = async (options: LiveSchema, endpoint?: string) => {
    try {
      const key = await getApiKey();
      const deepgram = createClient(key);

      const conn = deepgram.listen.live(options, endpoint);

      conn.addListener(LiveTranscriptionEvents.Open, () => {
        setConnectionState(SOCKET_STATES.open);
      });

      conn.addListener(LiveTranscriptionEvents.Close, () => {
        setConnectionState(SOCKET_STATES.closed);
      });

      conn.addListener(LiveTranscriptionEvents.Error, (error) => {
        logError("Deepgram error", {
          error,
        });
        alert("Sorry, something went wrong. Please try again.");
      });

      setConnection(conn);
    } catch (error) {
      // Handle errors from getApiKey or other parts of the connection process
      logError("Failed to connect to Deepgram", { error });

      // Display a user-friendly error message
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(
          "Failed to connect to Deepgram. Please refresh the page and try again."
        );
      }

      // Make sure connectionState is reset to closed
      setConnectionState(SOCKET_STATES.closed);
    }
  };

  const disconnectFromDeepgram = async () => {
    if (connection) {
      connection.disconnect();
      setConnection(null);
    }
  };

  return (
    <DeepgramContext.Provider
      value={{
        connection,
        connectToDeepgram,
        disconnectFromDeepgram,
        connectionState,
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
};

function useDeepgram(): DeepgramContextType {
  const context = useContext(DeepgramContext);
  if (context === undefined) {
    throw new Error(
      "useDeepgram must be used within a DeepgramContextProvider"
    );
  }
  return context;
}

export {
  DeepgramContextProvider,
  useDeepgram,
  SOCKET_STATES,
  type LiveTranscriptionEvent,
};
