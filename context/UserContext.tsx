"use client";

import { Session, User } from "@supabase/supabase-js";
import posthog from "posthog-js";
import { createContext, ReactNode, useContext, useEffect } from "react";

type ContextType = {
  session: Session | null;
  user: User | null;
};

const Context = createContext<ContextType>({ user: null, session: null });

export const useSession = () => useContext(Context).session;
export const useUser = () => useContext(Context).user;

export const UserProvider = ({
  children,
  user,
  session,
}: {
  children: ReactNode;
  user: User | null;
  session: Session | null;
}) => {
  useEffect(() => {
    if (user?.id) {
      posthog.identify(user.id, { email: user.email, userId: user.id });
    }
  }, [user]);

  return (
    <Context.Provider
      value={{
        user,
        session,
      }}
    >
      {children}
    </Context.Provider>
  );
};
