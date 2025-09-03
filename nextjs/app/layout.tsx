import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { getLocale, getMessages } from "next-intl/server";
import { AxiomWebVitals, Logger } from "next-axiom";
import { IntlProvider, PHProvider } from "./providers";
import {
  createAdminClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";
import { AxiomLoggingProvider } from "@/context/AxiomLoggingContext";
import { UserProvider } from "@/context/UserContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarWrapper } from "@/components/sidebar/sidebar-wrapper";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { Tables } from "@/utils/supabase/database.types";
import { DeepgramContextProvider } from "@/context/DeepgramContext";
import { posthog } from "@/utils/tracking/serverUtils";
import Script from "next/script";
import { KnowledgeBaseProvider } from "@/app/context/KnowledgeBaseContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { MultiTenantProvider } from "./context/MultiTenantContext";
import { ReferralProvider } from "./context/referral-context";
import { getServerUser } from "@/utils/auth/server";
import { UnsupportedBrowser } from "@/components/unsupported-browser";

const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? `https://${process.env.NEXT_PUBLIC_SITE_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Yorby",
  description: "Crush your next interview with free AI-powered interview prep",
};

export interface StudentWithEmailAndName extends Tables<"user_coach_access"> {
  email: string;
  name: string;
}

export interface CoachInfo {
  isCoach: boolean;
  coachData: Tables<"coaches"> | null;
}

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

const fetchUserCoachInfo = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({ function: "fetchUserCoachInfo", userId });
  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logger.error("Error fetching coach info", { error });
    await logger.flush();
    return { isCoach: false, coachData: null };
  }

  return {
    isCoach: data !== null,
    coachData: data,
  };
};

const fetchJobs = async (userId: string, userCoachId: string | null = null) => {
  const supabase = await createSupabaseServerClient();

  // Start with base query to get user's jobs (excluding company jobs)
  let query = supabase
    .from("custom_jobs")
    .select("*")
    .eq("user_id", userId)
    .is("company_id", null);

  // If user has a coach, exclude jobs created by that coach
  // This ensures student view doesn't show jobs where they're a student of the coach
  if (userCoachId) {
    query = query.neq("coach_id", userCoachId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }
  return data;
};

const fetchCoachJobs = async (coachId: string, userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("coach_id", coachId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

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

const fetchInterviewCopilots = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_copilots")
    .select("*")
    .eq("user_id", userId)
    .eq("deletion_status", "not_deleted")
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data;
};

const fetchResumes = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data;
};

const fetchStudents = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return [];
  }
  const coachId = data.id;
  const { data: students, error: studentsError } = await supabase
    .from("user_coach_access")
    .select("*")
    .eq("coach_id", coachId);
  if (studentsError) {
    throw studentsError;
  }
  const studentsWithEmailAndName = await Promise.all(
    students.map(async (student) => {
      const supabase = await createAdminClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.admin.getUserById(student.user_id);
      if (userError) {
        throw userError;
      }
      if (!user || !user.email) {
        throw new Error("User not found");
      }
      return {
        ...student,
        email: user.email,
        name: user.user_metadata.display_name ?? "",
      };
    })
  );
  return studentsWithEmailAndName;
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const user = await getServerUser();
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  let interviewCopilots: Tables<"interview_copilots">[] = [];
  let jobs: Tables<"custom_jobs">[] = [];
  let coachJobs: Tables<"custom_jobs">[] = [];
  let resumes: Tables<"resumes">[] = [];
  let numberOfCredits = 0;
  let hasSubscription = false;
  let onboardingState = null;
  let isResumeBuilderEnabled = false;
  let isSubscriptionVariant = false;
  let isMemoriesEnabled = false;
  let enableTransformResume = false;
  let referralsEnabled = false;
  let students: StudentWithEmailAndName[] = [];
  let coachInfo: CoachInfo = { isCoach: false, coachData: null };

  if (user) {
    // Fetch coach information first to determine if user is a coach
    coachInfo = await fetchUserCoachInfo(user.id);
    // Fetch standard data
    numberOfCredits = await fetchNumberOfCredits(user.id);
    hasSubscription = await fetchHasSubscription(user.id);
    jobs = await fetchJobs(user.id, coachInfo.coachData?.id);
    interviewCopilots = await fetchInterviewCopilots(user.id);

    // Fetch coach-specific data if user is a coach
    if (coachInfo.isCoach && coachInfo.coachData) {
      coachJobs = await fetchCoachJobs(coachInfo.coachData.id, user.id);
      students = await fetchStudents(user.id);
    }

    isSubscriptionVariant =
      (await posthog.getFeatureFlag("subscription-price-test-1", user.id)) ===
      "test";
    isResumeBuilderEnabled = Boolean(
      await posthog.isFeatureEnabled("enable-resume-builder", user.id)
    );
    if (isResumeBuilderEnabled) {
      resumes = await fetchResumes(user.id);
    }
    isMemoriesEnabled = Boolean(
      await posthog.isFeatureEnabled("enable-memories", user.id)
    );
    enableTransformResume = Boolean(
      await posthog.isFeatureEnabled("transform-resume-feature", user.id)
    );
    referralsEnabled = Boolean(
      await posthog.isFeatureEnabled("enable-referrals", user.id)
    );
  }

  const messages = await getMessages();
  return (
    <html
      lang={locale}
      className={geistSans.className}
      suppressHydrationWarning
    >
      <head>
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '621417864192927');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=621417864192927&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
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
              defaultTheme="light"
              forcedTheme="light"
              disableTransitionOnChange
            >
              <UserProvider user={user} session={session}>
                <ReferralProvider>
                  <AxiomWebVitals />
                  <AxiomLoggingProvider user={user}>
                    <MultiTenantProvider>
                      <DeepgramContextProvider>
                        <SidebarProvider>
                          <OnboardingProvider initialState={onboardingState}>
                            <KnowledgeBaseProvider
                              isMemoriesEnabled={isMemoriesEnabled}
                            >
                              <SidebarWrapper
                                jobs={jobs}
                                coachJobs={coachJobs}
                                coachInfo={coachInfo}
                                numberOfCredits={numberOfCredits}
                                hasSubscription={hasSubscription}
                                user={user}
                                interviewCopilots={interviewCopilots}
                                isResumeBuilderEnabled={isResumeBuilderEnabled}
                                resumes={resumes}
                                isSubscriptionVariant={isSubscriptionVariant}
                                isMemoriesEnabled={isMemoriesEnabled}
                                enableTransformResume={enableTransformResume}
                                referralsEnabled={referralsEnabled}
                                students={students}
                              />
                              {/* <SidebarTrigger /> */}
                              <main className="w-full bg-background">
                                {children}
                              </main>
                              <UnsupportedBrowser />
                              <Toaster />
                              <SonnerToaster />
                            </KnowledgeBaseProvider>
                          </OnboardingProvider>
                        </SidebarProvider>
                      </DeepgramContextProvider>
                    </MultiTenantProvider>
                  </AxiomLoggingProvider>
                </ReferralProvider>
              </UserProvider>
            </ThemeProvider>
          </IntlProvider>
        </PHProvider>
      </body>
    </html>
  );
}
