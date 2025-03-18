import { createSupabaseServerClient } from "@/utils/supabase/server";
import { ResumeDataType } from "../../dashboard/resumes/components/ResumeBuilder";
import SampleResume from "./SampleResume";
type ResumeMetadata = {
  id: string;
  slug: string;
  resumes: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    resume_sections: any[];
    created_at: string;
    updated_at: string;
    user_id: string;
    title: string;
    summary: string | null;
  };
};

// export async function generateStaticParams() {
//   const supabase = createSSGClient();
//   const { data, error } = await supabase.from("resumes").select("slug");

//   if (error) {
//     throw new Error(error.message);
//   }

//   return data.map((resume) => ({
//     slug: resume.slug,
//   }));
// }

export default async function SamplesResumesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const { data, error } = (await supabase
    .from("resume_metadata")
    .select(
      `*,
      resumes(
        *, 
        resume_sections(
          *, 
          resume_list_items(*), 
          resume_detail_items(
            *,
            resume_item_descriptions(*)
          )
        )
      )
      `
    )
    .eq("slug", slug)
    .single()) as { data: ResumeMetadata | null; error: any };

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.resumes) {
    throw new Error("Resume not found");
  }
  const resume = data.resumes;

  const resumeData: ResumeDataType = {
    id: resume.id,
    name: resume.name || "Sample Resume",
    email: resume.email || "sample@example.com",
    phone: resume.phone || "(123) 456-7890",
    location: resume.location || "San Francisco, CA",
    resume_sections: resume.resume_sections.sort((a, b) => {
      if (a.title.toLowerCase().includes("education")) return -1;
      if (b.title.toLowerCase().includes("education")) return 1;
      return a.display_order - b.display_order;
    }),
    created_at: resume.created_at,
    updated_at: resume.updated_at,
    user_id: resume.user_id,
    title: resume.title || "Sample Resume",
    summary: resume.summary,
    locked_status: "locked",
  };

  return <SampleResume resumeData={resumeData} resumeId={resume.id} />;
}
