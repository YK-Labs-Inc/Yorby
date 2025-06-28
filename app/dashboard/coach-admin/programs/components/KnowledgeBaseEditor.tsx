import { createSupabaseServerClient } from "@/utils/supabase/server";
import KnowledgeBaseManager from "./KnowledgeBaseManager";

async function getKnowledgeBaseData(programId: string) {
  const supabase = await createSupabaseServerClient();

  // Fetch knowledge base
  const { data: knowledgeBase } = await supabase
    .from("custom_job_knowledge_base")
    .select("knowledge_base")
    .eq("custom_job_id", programId)
    .single();

  // Fetch uploaded files
  const { data: files } = await supabase
    .from("custom_job_knowledge_base_files")
    .select("*")
    .eq("custom_job_id", programId)
    .order("created_at", { ascending: false });

  return {
    knowledgeBase: knowledgeBase?.knowledge_base || null,
    files: files || [],
  };
}

interface KnowledgeBaseEditorProps {
  programId: string;
  coachId: string;
}

export default async function KnowledgeBaseEditor({
  programId,
  coachId,
}: KnowledgeBaseEditorProps) {
  const { knowledgeBase, files } = await getKnowledgeBaseData(programId);

  return (
    <div className="w-full">
      <KnowledgeBaseManager
        programId={programId}
        coachId={coachId}
        initialKnowledgeBase={knowledgeBase}
        initialFiles={files}
      />
    </div>
  );
}
