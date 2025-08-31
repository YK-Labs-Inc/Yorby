import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { getServerUser } from "@/utils/auth/server";

export const GET = withAxiom(
  async (
    req: AxiomRequest,
    { params }: { params: Promise<{ resumeId: string }> }
  ) => {
    const { resumeId } = await params;
    const logger = req.log.with({
      route: "/api/resumes/[resumeId]",
      resumeId,
    });

    try {
      const supabase = await createSupabaseServerClient();

      // Get the current user
      const user = await getServerUser();

      if (!user) {
        logger.error("User not found");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Fetch the resume and all related data
      const { data: resume, error: resumeError } = await supabase
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
        .eq("user_id", user.id)
        .single();

      if (resumeError) {
        logger.error("Failed to fetch resume", { error: resumeError });
        return NextResponse.json(
          { error: "Failed to fetch resume" },
          { status: 500 }
        );
      }

      if (!resume) {
        logger.error("Resume not found");
        return NextResponse.json(
          { error: "Resume not found" },
          { status: 404 }
        );
      }

      // Sort sections and their items by display_order
      resume.resume_sections = resume.resume_sections
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((section: any) => ({
          ...section,
          resume_detail_items: section.resume_detail_items
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((item: any) => ({
              ...item,
              resume_item_descriptions: item.resume_item_descriptions.sort(
                (a: any, b: any) => a.display_order - b.display_order
              ),
            })),
          resume_list_items: section.resume_list_items.sort(
            (a: any, b: any) => a.display_order - b.display_order
          ),
        }));

      return NextResponse.json(resume);
    } catch (error) {
      logger.error("Unexpected error", { error });
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
