import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { fetchResume } from "../../actions";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import ResumeTransformation from "./ResumeTransformation";

const fetchResumeData = async (resumeId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("resumes")
    .select(
      `*, 
              resume_sections(
                *, 
                resume_list_items(*), 
                resume_detail_items(
                  *,
                  resume_item_descriptions(*))
              )`
    )
    .eq("id", resumeId)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export default async function TransformPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const t = await getTranslations("resumeBuilder");
  const resumeId = (await params).resumeId;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const resume = await fetchResumeData(resumeId);
  if (!resume) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            {t("errors.notFound.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("errors.notFound.description")}
          </p>
          <div className="pt-4">
            <Link href="/dashboard/resumes">
              <Button>{t("errors.notFound.action")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return <ResumeTransformation resume={resume} />;
}
