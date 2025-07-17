"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Logger } from "next-axiom";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";

const log = new Logger().with({ module: "actions/companies" });

interface CreateCompanyParams {
  name: string;
  website?: string | null;
  industry?: string | null;
  company_size?: string | null;
}

export async function createCompany({
  name,
  website,
  industry,
  company_size,
}: CreateCompanyParams) {
  try {
    const supabase = await createClient();
    const t = await getTranslations("recruitingActions.errors");

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: t("unauthorized") };
    }

    // Validate required fields
    if (!name) {
      return { error: t("companyNameRequired") };
    }

    // Create the company
    // The database trigger will automatically create the company_members entry
    const { error: companyError } = await supabase.from("companies").insert({
      name,
      website: website || null,
      industry: industry || null,
      company_size: company_size || null,
    });

    if (companyError) {
      log.error("Error creating company", {
        error: companyError,
        userId: user.id,
        companyName: name,
      });

      // Return specific error messages
      if (companyError.code === "23505") {
        return { error: t("companyAlreadyExists") };
      } else if (companyError.code === "42501") {
        return {
          error: t("permissionDenied"),
        };
      }

      return { error: t("failedToCreateCompany") };
    }

    log.info("Company created successfully", {
      userId: user.id,
    });

    // Revalidate the recruiting page to show the new company
    revalidatePath("/recruiting");

    return { error: null };
  } catch (error) {
    log.error("Unexpected error creating company", { error });
    const t = await getTranslations("recruitingActions.errors");
    return { error: t("unexpectedError") };
  }
}

interface CreateJobParams {
  job_title: string;
  job_description: string;
  company_id: string;
}

export async function createJob({
  job_title,
  job_description,
  company_id,
}: CreateJobParams) {
  const createJobLog = new Logger().with({
    function: "createJob",
    params: { company_id, job_title },
  });
  try {
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("recruitingActions.errors");

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: t("unauthorized") };
    }

    // Validate required fields
    if (!job_title || !job_description || !company_id) {
      return { error: t("missingRequiredFields") };
    }

    // Get company details and verify user has access
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      createJobLog.error("Company not found", {
        error: companyError,
        userId: user.id,
        companyId: company_id,
      });
      return { error: t("companyNotFound") };
    }

    // Check if user is a member of the company
    const { data: member, error: memberError } = await supabase
      .from("company_members")
      .select("role")
      .eq("company_id", company_id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      createJobLog.error("User not authorized for company", {
        error: memberError,
        userId: user.id,
        companyId: company_id,
      });
      return {
        error: t("notAuthorizedForCompany"),
      };
    }

    // Check if user has permission to create jobs (owner, admin, or recruiter)
    if (!["owner", "admin", "recruiter"].includes(member.role)) {
      createJobLog.error("Insufficient permissions", {
        userId: user.id,
        companyId: company_id,
        role: member.role,
      });
      return {
        error: t("noPermissionToCreateJobs"),
      };
    }

    // Create the job
    const { error: jobError } = await supabase
      .from("custom_jobs")
      .insert({
        job_title,
        job_description,
        status: "unlocked",
        company_id,
        company_name: company.name,
        user_id: user.id,
      })
      .select()
      .single();

    if (jobError) {
      createJobLog.error("Error creating job", {
        error: jobError,
        userId: user.id,
        companyId: company_id,
      });
      return { error: t("failedToCreateJob") };
    }

    createJobLog.info("Job created successfully", {
      userId: user.id,
      companyId: company_id,
    });

    // Revalidate the company jobs page
    revalidatePath(`/recruiting/companies/${company.id}/jobs`);

    return { error: null };
  } catch (error) {
    createJobLog.error("Unexpected error creating job", { error });
    const t = await getTranslations("recruitingActions.errors");
    return { error: t("unexpectedError") };
  }
}
