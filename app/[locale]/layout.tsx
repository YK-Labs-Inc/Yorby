import { ThemeSwitcher } from "@/components/theme-switcher";
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

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Perfect Interview",
  description: "Perfect Your Next Interview With AI-Powered Interview Prep",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

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
              <AxiomWebVitals />
              <AxiomLoggingProvider user={user}>
                <main>
                  {children}
                  <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
                    <p>© 2025 YK Labs. All rights reserved.</p>
                    <ThemeSwitcher />
                  </footer>
                </main>
              </AxiomLoggingProvider>
            </ThemeProvider>
          </IntlProvider>
        </PHProvider>
      </body>
    </html>
  );
}
