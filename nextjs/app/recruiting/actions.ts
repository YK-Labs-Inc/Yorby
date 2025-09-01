"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Logger } from "next-axiom";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getServerUser } from "@/utils/auth/server";

const log = new Logger().with({ module: "actions/companies" });

export async function createCompany(
  prevState: { success?: boolean; error?: string | null },
  formData: FormData
) {
  const name = formData.get("name") as string;
  const website = formData.get("website") as string | null;
  const industry = formData.get("industry") as string | null;
  const company_size = formData.get("company_size") as string | null;
  let companyId: string | null = null;
  const t = await getTranslations("recruitingActions.errors");

  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const user = await getServerUser();

    if (!user) {
      return { success: false, error: t("unauthorized") };
    }

    // Validate required fields
    if (!name) {
      return { success: false, error: t("companyNameRequired") };
    }

    // Create the company
    // The database trigger will automatically create the company_members entry
    const { error: companyError, data: company } = await supabase
      .from("companies")
      .insert({
        name,
        website: website || null,
        industry: industry || null,
        company_size: company_size || null,
      })
      .select()
      .single();

    if (companyError) {
      log.error("Error creating company", {
        error: companyError,
        userId: user.id,
        companyName: name,
      });

      // Return specific error messages
      if (companyError.code === "23505") {
        return { success: false, error: t("companyAlreadyExists") };
      } else if (companyError.code === "42501") {
        return {
          success: false,
          error: t("permissionDenied"),
        };
      }

      return { success: false, error: t("failedToCreateCompany") };
    }

    log.info("Company created successfully", {
      userId: user.id,
    });
    companyId = company.id;
  } catch (error) {
    log.error("Unexpected error creating company", { error });
    const t = await getTranslations("recruitingActions.errors");
    return { success: false, error: t("unexpectedError") };
  }

  if (companyId) {
    redirect(`/recruiting/companies/${companyId}`);
  }

  return { success: false, error: t("unexpectedError") };
}

export async function createJob(
  prevState: { success?: boolean; error?: string | null },
  formData: FormData
) {
  const job_title = formData.get("job_title") as string;
  const job_description = formData.get("job_description") as string;
  const company_id = formData.get("company_id") as string;

  const createJobLog = new Logger().with({
    function: "createJob",
    params: { company_id, job_title },
  });
  try {
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("recruitingActions.errors");

    // Check if user is authenticated
    const user = await getServerUser();

    if (!user) {
      return { success: false, error: t("unauthorized") };
    }

    // Validate required fields
    if (!job_title || !job_description || !company_id) {
      return { success: false, error: t("missingRequiredFields") };
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
      return { success: false, error: t("companyNotFound") };
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
        success: false,
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
        success: false,
        error: t("noPermissionToCreateJobs"),
      };
    }

    // Create the job
    const { error: jobError } = await supabase.from("custom_jobs").insert({
      job_title,
      job_description,
      status: "unlocked",
      company_id,
      company_name: company.name,
      user_id: user.id,
    });

    if (jobError) {
      createJobLog.error("Error creating job", {
        error: jobError,
        userId: user.id,
        companyId: company_id,
      });
      return { success: false, error: t("failedToCreateJob") };
    }

    createJobLog.info("Job created successfully", {
      userId: user.id,
      companyId: company_id,
    });

    // Revalidate the company jobs page
    revalidatePath(`/recruiting/companies/${company.id}/jobs`);

    return { success: true, error: null };
  } catch (error) {
    createJobLog.error("Unexpected error creating job", { error });
    const t = await getTranslations("recruitingActions.errors");
    return { success: false, error: t("unexpectedError") };
  }
}

export async function updateJob(
  prevState: { success?: boolean; error?: string },
  formData: FormData
) {
  const jobId = formData.get("job_id") as string;
  const job_title = formData.get("job_title") as string;
  const job_description = formData.get("job_description") as string;
  const company_id = formData.get("company_id") as string;

  const updateJobLog = new Logger().with({
    function: "updateJob",
    params: { jobId, job_title, company_id },
  });

  try {
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("recruitingActions.errors");

    // Check if user is authenticated
    const user = await getServerUser();

    if (!user) {
      return { success: false, error: t("unauthorized") };
    }

    // Validate required fields
    if (!job_title || !job_description || !company_id || !jobId) {
      return { success: false, error: t("missingRequiredFields") };
    }

    // Check if user is a member of the company with appropriate role
    const { data: member, error: memberError } = await supabase
      .from("company_members")
      .select("role")
      .eq("company_id", company_id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      updateJobLog.error("User not authorized for company", {
        error: memberError,
        userId: user.id,
        companyId: company_id,
      });
      return {
        success: false,
        error: t("notAuthorizedForCompany"),
      };
    }

    // Check if user has permission to update jobs (owner, admin, or recruiter)
    if (!["owner", "admin", "recruiter"].includes(member.role)) {
      updateJobLog.error("Insufficient permissions", {
        userId: user.id,
        companyId: company_id,
        role: member.role,
      });
      return {
        success: false,
        error: t("noPermissionToCreateJobs"),
      };
    }

    // Update the job
    const { error: updateError } = await supabase
      .from("custom_jobs")
      .update({
        job_title,
        job_description,
      })
      .eq("id", jobId)
      .eq("company_id", company_id);

    if (updateError) {
      updateJobLog.error("Error updating job", {
        error: updateError,
        userId: user.id,
        companyId: company_id,
        jobId,
      });
      return { success: false, error: t("failedToCreateJob") };
    }

    updateJobLog.info("Job updated successfully", {
      userId: user.id,
      companyId: company_id,
      jobId,
    });

    // Revalidate the company jobs page
    revalidatePath(`/recruiting/companies/${company_id}/jobs`);

    return { success: true };
  } catch (error) {
    updateJobLog.error("Unexpected error updating job", { error });
    const t = await getTranslations("recruitingActions.errors");
    return { success: false, error: t("unexpectedError") };
  }
}

export async function deleteJob(
  prevState: { success?: boolean; error?: string },
  formData: FormData
) {
  const jobId = formData.get("job_id") as string;
  const company_id = formData.get("company_id") as string;

  const deleteJobLog = new Logger().with({
    function: "deleteJob",
    params: { jobId, company_id },
  });

  try {
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("recruitingActions.errors");

    // Check if user is authenticated
    const user = await getServerUser();

    if (!user) {
      return { success: false, error: t("unauthorized") };
    }

    // Check if user is a member of the company with appropriate role
    const { data: member, error: memberError } = await supabase
      .from("company_members")
      .select("role")
      .eq("company_id", company_id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      deleteJobLog.error("User not authorized for company", {
        error: memberError,
        userId: user.id,
        companyId: company_id,
      });
      return {
        success: false,
        error: t("notAuthorizedForCompany"),
      };
    }

    // Check if user has permission to delete jobs (owner, admin, or recruiter)
    if (!["owner", "admin", "recruiter"].includes(member.role)) {
      deleteJobLog.error("Insufficient permissions", {
        userId: user.id,
        companyId: company_id,
        role: member.role,
      });
      return {
        success: false,
        error: t("noPermissionToCreateJobs"),
      };
    }

    // Delete the job
    const { error: deleteError } = await supabase
      .from("custom_jobs")
      .delete()
      .eq("id", jobId)
      .eq("company_id", company_id);

    if (deleteError) {
      deleteJobLog.error("Error deleting job", {
        error: deleteError,
        userId: user.id,
        companyId: company_id,
        jobId,
      });
      return { success: false, error: t("failedToCreateJob") };
    }

    deleteJobLog.info("Job deleted successfully", {
      userId: user.id,
      companyId: company_id,
      jobId,
    });

    // Revalidate the company jobs page
    revalidatePath(`/recruiting/companies/${company_id}/jobs`);

    return { success: true };
  } catch (error) {
    deleteJobLog.error("Unexpected error deleting job", { error });
    const t = await getTranslations("recruitingActions.errors");
    return { success: false, error: t("unexpectedError") };
  }
}

export async function updateCompany(
  prevState: { success?: boolean; error?: string },
  formData: FormData
) {
  const companyId = formData.get("company_id") as string;
  const name = formData.get("name") as string;
  const website = formData.get("website") as string | null;
  const industry = formData.get("industry") as string | null;
  const company_size = formData.get("company_size") as string | null;

  const updateCompanyLog = new Logger().with({
    function: "updateCompany",
    params: { companyId, name },
  });

  try {
    const supabase = await createClient();
    const t = await getTranslations("recruitingActions.errors");

    // Check if user is authenticated
    const user = await getServerUser();

    if (!user) {
      return { success: false, error: t("unauthorized") };
    }

    // Validate required fields
    if (!name || !companyId) {
      return { success: false, error: t("missingRequiredFields") };
    }

    // Check if user is a member of the company with appropriate role
    const { data: member, error: memberError } = await supabase
      .from("company_members")
      .select("role")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      updateCompanyLog.error("User not authorized for company", {
        error: memberError,
        userId: user.id,
        companyId,
      });
      return {
        success: false,
        error: t("notAuthorizedForCompany"),
      };
    }

    // Check if user has permission to update company (owner or admin)
    if (!["owner", "admin"].includes(member.role)) {
      updateCompanyLog.error("Insufficient permissions", {
        userId: user.id,
        companyId,
        role: member.role,
      });
      return {
        success: false,
        error: t("permissionDenied"),
      };
    }

    // Update the company
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        name,
        website: website || null,
        industry: industry || null,
        company_size: company_size || null,
      })
      .eq("id", companyId);

    if (updateError) {
      updateCompanyLog.error("Error updating company", {
        error: updateError,
        userId: user.id,
        companyId,
      });
      return { success: false, error: t("failedToCreateCompany") };
    }

    updateCompanyLog.info("Company updated successfully", {
      userId: user.id,
      companyId,
    });

    // Revalidate the recruiting page
    revalidatePath("/recruiting");

    return { success: true };
  } catch (error) {
    updateCompanyLog.error("Unexpected error updating company", { error });
    const t = await getTranslations("recruitingActions.errors");
    return { success: false, error: t("unexpectedError") };
  }
}

export async function deleteCompany(
  prevState: { success?: boolean; error?: string },
  formData: FormData
) {
  const companyId = formData.get("company_id") as string;

  const deleteCompanyLog = new Logger().with({
    function: "deleteCompany",
    params: { companyId },
  });

  try {
    const supabase = await createClient();
    const t = await getTranslations("recruitingActions.errors");

    // Check if user is authenticated
    const user = await getServerUser();

    if (!user) {
      return { success: false, error: t("unauthorized") };
    }

    // Check if user is the owner of the company
    const { data: member, error: memberError } = await supabase
      .from("company_members")
      .select("role")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      deleteCompanyLog.error("User not authorized for company", {
        error: memberError,
        userId: user.id,
        companyId,
      });
      return {
        success: false,
        error: t("notAuthorizedForCompany"),
      };
    }

    // Only owner can delete company
    if (member.role !== "owner") {
      deleteCompanyLog.error("Only owner can delete company", {
        userId: user.id,
        companyId,
        role: member.role,
      });
      return {
        success: false,
        error: t("permissionDenied"),
      };
    }

    // Delete the company (will cascade delete all related data)
    const { error: deleteError } = await supabase
      .from("companies")
      .delete()
      .eq("id", companyId);

    if (deleteError) {
      deleteCompanyLog.error("Error deleting company", {
        error: deleteError,
        userId: user.id,
        companyId,
      });
      return { success: false, error: t("failedToCreateCompany") };
    }

    deleteCompanyLog.info("Company deleted successfully", {
      userId: user.id,
      companyId,
    });

    // Revalidate the recruiting page
    revalidatePath("/recruiting");

    return { success: true };
  } catch (error) {
    deleteCompanyLog.error("Unexpected error deleting company", { error });
    const t = await getTranslations("recruitingActions.errors");
    return { success: false, error: t("unexpectedError") };
  }
}
