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
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch("/api/deepgram/authenticate", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch API key: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!result.key) {
        throw new Error("API key not found in response");
      }

      return result.key;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount++;

      if (retryCount < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const backoffTime = Math.pow(2, retryCount - 1) * 1000;
        console.warn(
          `Retrying API key fetch (attempt ${retryCount}/${maxRetries}) after ${backoffTime}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      }
    }
  }

  // If we've reached this point, all retries have failed
  throw new Error(
    `Failed to retrieve Deepgram API key after ${maxRetries} attempts. Please refresh the page and try again. Last error: ${lastError?.message}`
  );
};

const DeepgramContextProvider: FunctionComponent<
  DeepgramContextProviderProps
> = ({ children }) => {
  const [connection, setConnection] = useState<LiveClient | null>(null);
  const [connectionState, setConnectionState] = useState<SOCKET_STATES>(
    SOCKET_STATES.closed
  );

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

      setConnection(conn);
    } catch (error) {
      // Handle errors from getApiKey or other parts of the connection process
      console.error("Failed to connect to Deepgram:", error);

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
