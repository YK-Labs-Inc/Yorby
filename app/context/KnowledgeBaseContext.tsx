"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { CoreMessage } from "ai";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { ToastAction } from "@/components/ui/toast";
import Link from "next/link";
import { useMultiTenant } from "./MultiTenantContext";

interface KnowledgeBaseContextType {
  knowledgeBase: string | null;
  isUpdatingKnowledgeBase: boolean;
  updateKnowledgeBase: (newMessages: CoreMessage[]) => Promise<void>;
  setKnowledgeBase: Dispatch<SetStateAction<string | null>>;
  setIsUpdatingKnowledgeBase: Dispatch<SetStateAction<boolean>>;
}

const KnowledgeBaseContext = createContext<
  KnowledgeBaseContextType | undefined
>(undefined);

export function KnowledgeBaseProvider({
  children,
  isMemoriesEnabled,
}: {
  children: ReactNode;
  isMemoriesEnabled: boolean;
}) {
  const [knowledgeBase, setKnowledgeBase] = useState<string | null>(null);
  const [isUpdatingKnowledgeBase, setIsUpdatingKnowledgeBase] = useState(false);
  const { logError } = useAxiomLogging();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("knowledgeBase");
  const { toast } = useToast();
  const { isCoachPath } = useMultiTenant();

  const updateKnowledgeBase = useCallback(
    async (newMessages: CoreMessage[]) => {
      if (!isMemoriesEnabled || isCoachPath) {
        return;
      }
      try {
        setIsUpdatingKnowledgeBase(true);
        const response = await fetch("/api/memories/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: newMessages,
          }),
        });

        if (!response.ok) {
          throw new Error(t("toast.error.updateFailed"));
        }

        const { updatedKnowledgeBase, didUpdateKnowledgeBase } =
          await response.json();
        setKnowledgeBase(updatedKnowledgeBase);

        if (
          didUpdateKnowledgeBase &&
          pathname &&
          !pathname.includes("/memories")
        ) {
          toast({
            title: t("toast.memoriesUpdated"),
            action: (
              <Link href="/memories">
                <ToastAction altText={t("toast.viewButton")}>
                  {t("toast.viewButton")}
                </ToastAction>
              </Link>
            ),
          });
        }
      } catch (error) {
        logError("Error updating knowledge base", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setIsUpdatingKnowledgeBase(false);
      }
    },
    [logError, pathname, t, toast, router]
  );

  return (
    <KnowledgeBaseContext.Provider
      value={{
        knowledgeBase,
        isUpdatingKnowledgeBase,
        updateKnowledgeBase,
        setKnowledgeBase,
        setIsUpdatingKnowledgeBase,
      }}
    >
      {children}
    </KnowledgeBaseContext.Provider>
  );
}

export function useKnowledgeBase() {
  const context = useContext(KnowledgeBaseContext);
  if (context === undefined) {
    throw new Error(
      "useKnowledgeBase must be used within a KnowledgeBaseProvider"
    );
  }
  return context;
}
