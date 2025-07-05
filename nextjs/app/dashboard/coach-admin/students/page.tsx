import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { redirect } from "next/navigation";
import {
  createAdminClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import StudentListEntry from "./StudentListEntry";

export interface Student {
  id: string;
  email?: string | null;
  full_name?: string | null;
  last_sign_in_at?: string | null;
}

const fetchStudentsForCoach = async () => {
  let logger = new Logger();
  const t = await getTranslations("coachAdminPortal.studentsPage");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: coachUser },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !coachUser) {
    logger.error(t("loggerMessages.errorFetchingAuthUser"), {
      error: userError,
    });
    return [];
  }

  logger = logger.with({ userId: coachUser.id });

  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", coachUser.id)
    .single();

  if (coachError || !coach) {
    logger.error(t("loggerMessages.errorFetchingCoachProfile"), {
      error: coachError,
    });
    return [];
  }

  const coachId = coach.id;

  logger = logger.with({ coachId });

  const { data: userCoachAccessEntries, error: accessError } = await supabase
    .from("user_coach_access")
    .select("user_id")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false });

  if (accessError) {
    logger.error(t("loggerMessages.errorFetchingAccessEntries"), {
      error: accessError,
    });
    return [];
  }

  if (!userCoachAccessEntries || userCoachAccessEntries.length === 0) {
    logger.info(t("loggerMessages.infoNoStudentsEnrolled"));
    return [];
  }

  const studentIds = userCoachAccessEntries.map((entry) => entry.user_id);

  const supabaseAdmin = await createAdminClient();

  // Create an array of promises for fetching each student's details
  const studentDetailPromises = studentIds.map((studentId) =>
    supabaseAdmin.auth.admin.getUserById(studentId)
  );

  // Execute all promises in parallel and wait for all to settle
  const studentDetailsResults = await Promise.allSettled(studentDetailPromises);

  const studentsList: Student[] = [];

  studentDetailsResults.forEach((result, index) => {
    const studentId = studentIds[index]; // Get corresponding studentId

    if (result.status === "fulfilled") {
      const { data: studentData, error: studentError } = result.value;

      if (studentError) {
        logger.error(t("loggerMessages.errorInFulfilledStudentPromise"), {
          studentId,
          error: studentError,
        });
        studentsList.push({
          id: studentId,
          email: t("placeholders.errorEmail"),
          full_name: t("placeholders.errorName"),
        });
      } else if (studentData && studentData.user) {
        studentsList.push({
          id: studentData.user.id,
          email:
            studentData.user.email || t("tableCellFallbacks.notApplicable"),
          full_name:
            studentData.user.user_metadata?.display_name ||
            t("tableCellFallbacks.notApplicable"),
          last_sign_in_at: studentData.user.last_sign_in_at || null,
        });
      } else {
        logger.warn(t("loggerMessages.warningNoStudentData"), {
          studentId,
        });
        studentsList.push({
          id: studentId,
          email: t("placeholders.notFound"),
          full_name: t("placeholders.notFound"),
        });
      }
    } else {
      logger.error(t("loggerMessages.errorStudentDetailFailed"), {
        studentId,
        error: result.reason,
      });
      studentsList.push({
        id: studentId,
        email: t("placeholders.failedToFetch"),
        full_name: t("placeholders.failedToFetch"),
      });
    }
  });

  return studentsList;
};

export default async function ListEnrolledStudentsPage() {
  const t = await getTranslations("coachAdminPortal.studentsPage");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const students = await fetchStudentsForCoach();

  const { data: coachCheck } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!coachCheck) {
    redirect("/onboarding");
  }

  if (students.length === 0) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("pageTitle")}
          </h1>
          <p className="text-muted-foreground">{t("pageDescription")}</p>
        </div>
        <p>{t("emptyState.noStudentsMessage")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">{t("pageDescription")}</p>
      </div>
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tableHeaders.email")}</TableHead>
              <TableHead>{t("tableHeaders.fullName")}</TableHead>
              <TableHead>{t("tableHeaders.lastSignIn")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student: Student) => (
              <StudentListEntry key={student.id} student={student} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
