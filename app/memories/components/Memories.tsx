import { Card } from "@/components/ui/card";
import { Tables } from "@/utils/supabase/database.types";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import {
  SetStateAction,
  Dispatch,
  useEffect,
  useState,
  useCallback,
} from "react";
import { motion } from "framer-motion";
import { FileText, FileIcon, Edit2, Save, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUser } from "@/context/UserContext";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

type ViewType = "knowledgeBase" | "files";

export const MemoriesView = ({
  isUpdatingKnowledgeBase,
  setIsUpdatingKnowledgeBase,
  fetchFiles,
  files,
  knowledgeBase,
  setKnowledgeBase,
  fetchKnowledgeBase,
}: {
  isUpdatingKnowledgeBase: boolean;
  setIsUpdatingKnowledgeBase: Dispatch<SetStateAction<boolean>>;
  fetchFiles: () => Promise<void>;
  files: Tables<"user_files">[];
  knowledgeBase: string | null;
  setKnowledgeBase: Dispatch<SetStateAction<string | null>>;
  fetchKnowledgeBase: () => Promise<void>;
}) => {
  const t = useTranslations("knowledgeBase");
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewType>("knowledgeBase");
  const user = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedKnowledgeBase, setEditedKnowledgeBase] = useState<string>("");
  const { logError } = useAxiomLogging();

  const handleFetchFiles = useCallback(async () => {
    if (!user) return;
    try {
      await fetchFiles();
    } catch (error) {
      logError("Error fetching files", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [user, fetchFiles, logError]);

  useEffect(() => {
    setEditedKnowledgeBase(knowledgeBase || "");
  }, [knowledgeBase]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (activeView === "knowledgeBase") {
          await fetchKnowledgeBase();
        } else if (activeView === "files") {
          await handleFetchFiles();
        }
      } catch (error) {
        logError("Error fetching knowledge base", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeView, handleFetchFiles, fetchKnowledgeBase]);

  const handleDeleteFile = async (file: Tables<"user_files">) => {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();

    try {
      setIsLoading(true);
      // First delete the file from storage
      const { error: storageError } = await supabase.storage
        .from(file.bucket_name)
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Then delete the database record
      const { error: dbError } = await supabase
        .from("user_files")
        .delete()
        .eq("id", file.id)
        .eq("user_id", user.id);

      if (dbError) throw dbError;

      // Refresh the files list
      handleFetchFiles();
    } catch (error) {
      logError("Error deleting file", {
        error: error instanceof Error ? error.message : String(error),
      });
      alert(t("error.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKnowledgeBase = async () => {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();

    try {
      setIsUpdatingKnowledgeBase(true);
      const { error } = await supabase.from("user_knowledge_base").upsert(
        {
          user_id: user.id,
          knowledge_base: editedKnowledgeBase || "",
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) throw error;

      setKnowledgeBase(editedKnowledgeBase);
      setIsEditing(false);
    } catch (error) {
      logError("Error saving knowledge base", {
        error: error instanceof Error ? error.message : String(error),
      });
      alert(t("error.generic"));
    } finally {
      setIsUpdatingKnowledgeBase(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <LoadingSpinner size="xl" className="mx-auto" />
          <p className="text-base md:text-lg font-medium text-gray-900 dark:text-gray-100">
            {t("loading")}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-center items-center pt-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-10">
        <button
          onClick={() => setActiveView("knowledgeBase")}
          className={`px-4 py-2 text-sm font-medium ${
            activeView === "knowledgeBase"
              ? "text-black border-b-2 border-black dark:text-white dark:border-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          {t("knowledgeBase.title")}
        </button>
        <button
          onClick={() => setActiveView("files")}
          className={`px-4 py-2 text-sm font-medium ${
            activeView === "files"
              ? "text-black border-b-2 border-black dark:text-white dark:border-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          {t("files.title")}
        </button>
      </div>

      <div className="flex-1 p-4 min-h-0 flex flex-col">
        {activeView === "knowledgeBase" ? (
          <>
            <div className="flex justify-end items-center mb-2">
              {!isEditing ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  {t("edit")}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveKnowledgeBase}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {t("save")}
                </Button>
              )}
            </div>

            <div className="flex-1 min-h-0 relative">
              {isUpdatingKnowledgeBase && (
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t("updating")}
                    </p>
                  </div>
                </div>
              )}
              {isEditing ? (
                <Textarea
                  value={editedKnowledgeBase}
                  onChange={(e) => setEditedKnowledgeBase(e.target.value)}
                  className="w-full h-full min-h-[500px]"
                />
              ) : knowledgeBase ? (
                <Card className="h-full overflow-y-auto">
                  <div className="p-6">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {knowledgeBase}
                    </ReactMarkdown>
                  </div>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <FileText className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {t("emptyState.title")}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md">
                      {t("emptyState.description")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {files.length > 0 ? (
              <Card className="h-full overflow-y-auto">
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {file.display_name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <FileText className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {t("files.emptyState.title")}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    {t("files.emptyState.description")}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
