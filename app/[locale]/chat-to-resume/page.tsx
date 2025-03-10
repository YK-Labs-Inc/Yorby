import { getTranslations } from "next-intl/server";
import CTA from "./CTA";
import { createSupabaseServerClient } from "@/utils/supabase/server";
export default async function ChatToResume() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("resumeBuilder.landingPage");

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-16 bg-background">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent animate-gradient-x">
          {t("title")}
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
          {t("description")}
        </p>

        <div className="mt-12">
          <CTA user={user} />
        </div>

        <div className="mt-12 rounded-xl overflow-hidden shadow-xl border border-border">
          <video
            className="w-full aspect-video"
            src="/assets/resume-builder-demo.mp4"
            autoPlay
            muted
            loop
            controls
            playsInline
          />
        </div>
      </div>
    </div>
  );
}
