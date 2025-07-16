import { createSupabaseServerClient } from "@/utils/supabase/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { NextResponse } from "next/server";

function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const POST = withAxiom(async (request: AxiomRequest) => {
  let logger = request.log.with({ path: "/api/company/register" });

  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      logger.error("Unauthorized: No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger = logger.with({ userId: user.id });

    // Parse request body
    const body = await request.json();
    const { companyName, companyWebsite, companySize, industry, customIndustry } = body;
    
    // Use custom industry if provided (when user selects "other")
    const finalIndustry = industry === 'other' && customIndustry ? customIndustry : industry;

    // Validate required fields
    if (!companyName || !companySize || !finalIndustry) {
      logger.error("Missing required fields", { body });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Note: Users can belong to multiple companies, so we don't check for existing memberships

    // Generate a unique slug for the company
    let slug = generateSlug(companyName);
    let slugSuffix = 0;
    let isSlugUnique = false;
    let finalSlug = slug;

    while (!isSlugUnique) {
      const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("slug", finalSlug)
        .single();

      if (!existingCompany) {
        isSlugUnique = true;
      } else {
        slugSuffix++;
        finalSlug = `${slug}-${slugSuffix}`;
      }
    }

    logger.info("Creating company with slug", { slug: finalSlug });

    // Create the company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: companyName.trim(),
        slug: finalSlug,
        website: companyWebsite || null,
        company_size: companySize,
        industry: finalIndustry,
      })
      .select()
      .single();

    if (companyError) {
      logger.error("Failed to create company", { error: companyError });
      return NextResponse.json(
        { error: "Failed to create company" },
        { status: 500 }
      );
    }

    logger.info("Company created successfully", {
      companyId: company.id,
      companyName: company.name,
      slug: company.slug,
    });

    // The trigger will automatically add the user as an owner
    // Let's verify the membership was created
    const { data: membership, error: verifyError } = await supabase
      .from("company_members")
      .select("*")
      .eq("company_id", company.id)
      .eq("user_id", user.id)
      .single();

    if (verifyError || !membership) {
      logger.error("Failed to verify company membership", {
        error: verifyError,
      });
      // Clean up the company if membership wasn't created
      await supabase.from("companies").delete().eq("id", company.id);
      return NextResponse.json(
        { error: "Failed to create company membership" },
        { status: 500 }
      );
    }

    logger.info("Company registration completed successfully", {
      companyId: company.id,
      memberId: membership.id,
      role: membership.role,
    });

    return NextResponse.json({
      success: true,
      company,
      membership,
    });
  } catch (error: any) {
    logger.error("Unexpected error during company registration", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});