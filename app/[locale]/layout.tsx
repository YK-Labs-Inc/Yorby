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
import { FormMessage } from "@/components/form-message";

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

const fetchJobs = async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("custom_jobs").select("*");
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
  const jobs = await fetchJobs();
  let numberOfCredits = 0;
  let hasSubscription = false;
  if (user) {
    numberOfCredits = await fetchNumberOfCredits(user.id);
    hasSubscription = await fetchHasSubscription(user.id);
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
                    <AppSidebar
                      jobs={jobs}
                      numberOfCredits={numberOfCredits}
                      hasSubscription={hasSubscription}
                      user={user}
                    />
                    <SidebarTrigger />
                    <main className="w-full">
                      <FormMessage />
                      {children}
                    </main>
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
