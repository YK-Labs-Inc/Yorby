import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getMessages } from "next-intl/server";
import { AxiomWebVitals } from "next-axiom";
import { IntlProvider, PHProvider } from "./providers";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { AxiomLoggingProvider } from "@/context/AxiomLoggingContext";
import { UserProvider } from "@/context/UserContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import Chatwoot from "@/components/ChatwootWidget";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { User } from "@supabase/supabase-js";
import { Tables } from "@/utils/supabase/database.types";

const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? `https://${process.env.NEXT_PUBLIC_SITE_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Perfect Interview",
  description: "Ace your next interview with AI-powered interview prep",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

const fetchJobs = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
  return data;
};

const fetchNumberOfCredits = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_job_credits")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data?.number_of_credits || 0;
};

const fetchHasSubscription = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data !== null;
};

const fetchOnboardingState = async (user: User) => {
  const supabase = await createSupabaseServerClient();
  const userId = user.id;

  const [{ data: jobs }, { data: submissions }, { data: mockInterviews }] =
    await Promise.all([
      // Check if user has created any jobs
      supabase
        .from("custom_jobs")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      // Check if user has submitted any answers
      supabase.from("custom_job_question_submissions").select(),
      // Check if user has completed any mock interviews
      supabase
        .from("custom_job_mock_interviews")
        .select("id")
        .eq("status", "complete")
        .limit(1)
        .maybeSingle(),
    ]);

  let unansweredQuestionId = null;
  if (!submissions || submissions.length === 0) {
    const { data: unansweredQuestion } = await supabase
      .from("custom_job_questions")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    unansweredQuestionId = unansweredQuestion?.id ?? null;
  }

  return {
    first_custom_job_created: !!jobs,
    first_answer_generated:
      submissions?.some(
        (submission) =>
          (submission.feedback as { pros: string[]; cons: string[] })?.pros
            .length === 0 &&
          (submission.feedback as { pros: string[]; cons: string[] })?.cons
            .length === 0
      ) ?? false,
    first_question_answered: submissions ? submissions.length > 0 : false,
    first_mock_interview_completed: !!mockInterviews,
    connected_account_to_email: user.email !== undefined,
    last_created_job_id: jobs?.id ?? null,
    last_unanswered_question_id: unansweredQuestionId,
  };
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const locale = (await params).locale;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  let jobs: Tables<"custom_jobs">[] = [];
  let numberOfCredits = 0;
  let hasSubscription = false;
  let onboardingState = null;
  if (user) {
    numberOfCredits = await fetchNumberOfCredits(user.id);
    hasSubscription = await fetchHasSubscription(user.id);
    onboardingState = await fetchOnboardingState(user);
    jobs = await fetchJobs(user.id);
  }
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  return (
    <html
      lang={locale}
      className={geistSans.className}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground">
        <PHProvider>
          <IntlProvider
            locale={locale}
            messages={messages}
            now={new Date()}
            timeZone="UTC"
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <UserProvider user={user} session={session}>
                <AxiomWebVitals />
                <AxiomLoggingProvider user={user}>
                  <SidebarProvider>
                    <OnboardingProvider initialState={onboardingState}>
                      <AppSidebar
                        jobs={jobs}
                        numberOfCredits={numberOfCredits}
                        hasSubscription={hasSubscription}
                        user={user}
                      />
                      <SidebarTrigger />
                      <main className="w-full">
                        {children}
                        <Chatwoot />
                      </main>
                    </OnboardingProvider>
                  </SidebarProvider>
                </AxiomLoggingProvider>
              </UserProvider>
            </ThemeProvider>
          </IntlProvider>
        </PHProvider>
      </body>
    </html>
  );
}
