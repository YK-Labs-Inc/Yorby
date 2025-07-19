import { createSupabaseServerClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { AxiomRequest, withAxiom } from "next-axiom";

// GET /api/companies - List companies
export const GET = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    method: request.method,
    path: "/api/companies",
  });

  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error("Authentication failed", { authError });
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch companies with pagination
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("*")
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (companiesError) {
      logger.error("Database error fetching companies", { companiesError });
      return NextResponse.json(
        { success: false, error: "Failed to fetch companies" },
        { status: 500 }
      );
    }

    logger.info("Companies fetched successfully", {
      count: companies.length,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    logger.error("Unexpected error in companies GET", { error });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

// POST /api/companies - Create a new company
export const POST = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    method: request.method,
    path: "/api/companies",
  });

  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error("Authentication failed", { authError });
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, slug, website, industry, company_size } = body;

    if (!name || !slug) {
      logger.error("Missing required fields", { name, slug });
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Create the company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name,
        slug,
        website,
        industry,
        company_size,
      })
      .select()
      .single();

    if (companyError) {
      logger.error("Database error creating company", { companyError });
      return NextResponse.json(
        { success: false, error: "Failed to create company" },
        { status: 500 }
      );
    }

    logger.info("Company created successfully", {
      companyId: company.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (error) {
    logger.error("Unexpected error in companies POST", { error });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
