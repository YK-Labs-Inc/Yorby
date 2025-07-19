import { createSupabaseServerClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { AxiomRequest, withAxiom } from "next-axiom";

interface RouteContext {
  params: Promise<{
    companyId: string;
  }>;
}

// GET /api/companies/[companyId] - Get a specific company
export const GET = withAxiom(
  async (request: AxiomRequest, context: RouteContext) => {
    const logger = request.log.with({
      method: request.method,
      path: "/api/companies/[companyId]",
    });

    try {
      const { companyId } = await context.params;
      const supabase = await createSupabaseServerClient();

      if (!companyId) {
        logger.error("Missing companyId parameter");
        return NextResponse.json(
          { success: false, error: "Company ID is required" },
          { status: 400 }
        );
      }

      // Fetch company data - no authentication required for public job pages
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (companyError) {
        if (companyError.code === "PGRST116") {
          logger.info("Company not found", { companyId });
          return NextResponse.json(
            { success: false, error: "Company not found" },
            { status: 404 }
          );
        }

        logger.error("Database error fetching company", {
          companyError,
          companyId,
        });
        return NextResponse.json(
          { success: false, error: "Failed to fetch company" },
          { status: 500 }
        );
      }

      logger.info("Company fetched successfully", { companyId });

      return NextResponse.json({
        success: true,
        data: company,
      });
    } catch (error) {
      logger.error("Unexpected error in company GET", { error });
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

// PUT /api/companies/[companyId] - Update a company
export const PUT = withAxiom(
  async (request: AxiomRequest, context: RouteContext) => {
    const logger = request.log.with({
      method: request.method,
      path: "/api/companies/[companyId]",
    });

    try {
      const { companyId } = await context.params;
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

      if (!companyId) {
        logger.error("Missing companyId parameter");
        return NextResponse.json(
          { success: false, error: "Company ID is required" },
          { status: 400 }
        );
      }

      const body = await request.json();
      const { name, slug, website, industry, company_size } = body;

      // Update the company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .update({
          name,
          slug,
          website,
          industry,
          company_size,
          updated_at: new Date().toISOString(),
        })
        .eq("id", companyId)
        .select()
        .single();

      if (companyError) {
        if (companyError.code === "PGRST116") {
          logger.info("Company not found for update", { companyId });
          return NextResponse.json(
            { success: false, error: "Company not found" },
            { status: 404 }
          );
        }

        logger.error("Database error updating company", {
          companyError,
          companyId,
        });
        return NextResponse.json(
          { success: false, error: "Failed to update company" },
          { status: 500 }
        );
      }

      logger.info("Company updated successfully", {
        companyId,
        userId: user.id,
      });

      return NextResponse.json({
        success: true,
        data: company,
      });
    } catch (error) {
      logger.error("Unexpected error in company PUT", { error });
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/companies/[companyId] - Delete a company
export const DELETE = withAxiom(
  async (request: AxiomRequest, context: RouteContext) => {
    const logger = request.log.with({
      method: request.method,
      path: "/api/companies/[companyId]",
    });

    try {
      const { companyId } = await context.params;
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

      if (!companyId) {
        logger.error("Missing companyId parameter");
        return NextResponse.json(
          { success: false, error: "Company ID is required" },
          { status: 400 }
        );
      }

      // Delete the company
      const { error: companyError } = await supabase
        .from("companies")
        .delete()
        .eq("id", companyId);

      if (companyError) {
        logger.error("Database error deleting company", {
          companyError,
          companyId,
        });
        return NextResponse.json(
          { success: false, error: "Failed to delete company" },
          { status: 500 }
        );
      }

      logger.info("Company deleted successfully", {
        companyId,
        userId: user.id,
      });

      return NextResponse.json({
        success: true,
        message: "Company deleted successfully",
      });
    } catch (error) {
      logger.error("Unexpected error in company DELETE", { error });
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
