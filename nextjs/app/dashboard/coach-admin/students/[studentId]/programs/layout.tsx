import React from "react";
import { notFound } from "next/navigation";
import {
  createAdminClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";
import StudentActivityHeader from "@/app/dashboard/coach-admin/components/StudentActivityHeader";
import QueryProvider from "./providers/QueryProvider";

// Fetch student info
const fetchStudent = async (studentId: string) => {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(studentId);
  if (error) return null;
  return data;
};

// Fetch coach info
const fetchCoach = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: coachUser },
  } = await supabase.auth.getUser();
  if (!coachUser) return null;
  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", coachUser.id)
    .single();
  return coach;
};

function formatDateForHeader(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default async function ProgramsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
    studentId: string;
  }>;
}) {
  const { studentId } = await params;
  const studentData = await fetchStudent(studentId);
  if (!studentData?.user) return notFound();

  const user = studentData.user;
  const name = user.user_metadata?.full_name || user.email || "Unknown";
  const role = user.user_metadata?.role || "";
  const started = formatDateForHeader(user.created_at);
  const lastSignIn = user.last_sign_in_at
    ? formatDateForHeader(user.last_sign_in_at)
    : null;

  const coach = await fetchCoach();
  if (!coach) return notFound();

  return (
    <QueryProvider>
      <div className="relative w-full min-h-screen bg-white">
        <StudentActivityHeader
          name={name}
          role={role}
          started={started}
          lastSignIn={lastSignIn}
        />
        <div
          className="flex flex-row w-full h-screen"
          style={{ height: "calc(100vh - 68px)" }}
        >
          {children}
        </div>
      </div>
    </QueryProvider>
  );
}
