import { createSupabaseServerClient } from "@/utils/supabase/server";
import KnowledgeBaseManager from "./KnowledgeBaseManager";

async function getKnowledgeBaseData(programId: string, coachId: string, userId: string) {
  const supabase = await createSupabaseServerClient();

  // Fetch program details
  const { data: program } = await supabase
    .from("custom_jobs")
    .select("job_title")
    .eq("id", programId)
    .eq("coach_id", coachId)
    .single();

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
    programTitle: program?.job_title || "",
    knowledgeBase: knowledgeBase?.knowledge_base || null,
    files: files || []
  };
}

interface KnowledgeBaseEditorProps {
  programId: string;
  coachId: string;
  userId: string;
}

export default async function KnowledgeBaseEditor({ 
  programId,
  coachId,
  userId
}: KnowledgeBaseEditorProps) {
  const { programTitle, knowledgeBase, files } = await getKnowledgeBaseData(programId, coachId, userId);

  return (
    <div className="w-full">
      <KnowledgeBaseManager
        programId={programId}
        coachId={coachId}
        userId={userId}
        programTitle={programTitle}
        initialKnowledgeBase={knowledgeBase}
        initialFiles={files}
      />
    </div>
  );
}