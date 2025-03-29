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
import { OnboardingProvider } from "@/context/OnboardingContext";
import { Tables } from "@/utils/supabase/database.types";
import { DeepgramContextProvider } from "@/context/DeepgramContext";
import { posthog } from "@/utils/tracking/serverUtils";
import Script from "next/script";

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
  let interviewCopilots: Tables<"interview_copilots">[] = [];
  let jobs: Tables<"custom_jobs">[] = [];
  let resumes: Tables<"resumes">[] = [];
  let numberOfCredits = 0;
  let hasSubscription = false;
  let onboardingState = null;
  let isResumeBuilderEnabled = false;
  let isSubscriptionVariant = false;
  if (user) {
    numberOfCredits = await fetchNumberOfCredits(user.id);
    hasSubscription = await fetchHasSubscription(user.id);
    jobs = await fetchJobs(user.id);
    interviewCopilots = await fetchInterviewCopilots(user.id);
    isSubscriptionVariant =
      (await posthog.getFeatureFlag("subscription-price-test-1", user.id)) ===
      "test";
    isResumeBuilderEnabled = Boolean(
      await posthog.isFeatureEnabled("enable-resume-builder", user.id)
    );
    if (isResumeBuilderEnabled) {
      resumes = await fetchResumes(user.id);
    }
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
                <AxiomWebVitals />
                <AxiomLoggingProvider user={user}>
                  <DeepgramContextProvider>
                    <SidebarProvider>
                      <OnboardingProvider initialState={onboardingState}>
                        <AppSidebar
                          jobs={jobs}
                          numberOfCredits={numberOfCredits}
                          hasSubscription={hasSubscription}
                          user={user}
                          interviewCopilots={interviewCopilots}
                          isResumeBuilderEnabled={isResumeBuilderEnabled}
                          resumes={resumes}
                          isSubscriptionVariant={isSubscriptionVariant}
                        />
                        <SidebarTrigger />
                        <main className="w-full">{children}</main>
                      </OnboardingProvider>
                    </SidebarProvider>
                  </DeepgramContextProvider>
                </AxiomLoggingProvider>
              </UserProvider>
            </ThemeProvider>
          </IntlProvider>
        </PHProvider>
      </body>
    </html>
  );
}
