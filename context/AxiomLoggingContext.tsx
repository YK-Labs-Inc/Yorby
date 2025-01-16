"use client";
import React, { createContext, useContext, useCallback } from "react";
import { useLogger } from "next-axiom";
import { User } from "@supabase/supabase-js";

export type LogFunction = (
  message: string,
  trackingProperties?: Record<string, any>
) => void;

type AxiomLoggingContextType = {
  logInfo: LogFunction;
  logError: LogFunction;
  logWarning: LogFunction;
};

const AxiomLoggingContext = createContext<AxiomLoggingContextType | undefined>(
  undefined
);

export const AxiomLoggingProvider: React.FC<{
  children: React.ReactNode;
  user: User | null;
}> = ({ children, user }) => {
  const log = useLogger();

  const logInfo: LogFunction = useCallback(
    (message, trackingProperties = {}) => {
      log.info(message, {
        userId: user?.id,
        ...trackingProperties,
      });
    },
    [user]
  );

  const logError: LogFunction = useCallback(
    (message, trackingProperties = {}) => {
      log.error(message, {
        userId: user?.id,
        ...trackingProperties,
      });
    },
    [user]
  );

  const logWarning: LogFunction = useCallback(
    (message, trackingProperties = {}) => {
      log.warn(message, {
        userId: user?.id,
        ...trackingProperties,
      });
    },
    [user]
  );

  return (
    <AxiomLoggingContext.Provider
      value={{
        logInfo,
        logError,
        logWarning,
      }}
    >
      {children}
    </AxiomLoggingContext.Provider>
  );
};

export const useAxiomLogging = () => {
  const context = useContext(AxiomLoggingContext);
  if (context === undefined) {
    throw new Error(
      "useAxiomLogging must be used within an AxiomLoggingProvider"
    );
  }
  return context;
};
