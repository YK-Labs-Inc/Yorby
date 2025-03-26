import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { FileText, CheckCircle, ArrowRight, Video, Mic } from "lucide-react";
import { useTranslations } from "next-intl";

export default function OurFetures() {
  const t = useTranslations("LandingPageV5.ourFeatures");

  // Helper function to get features array with proper typing
  const getFeatures = (key: string): string[] => {
    return t.raw(`${key}.featuresV2`) as string[];
  };

  return (
    <section id="features" className="py-20 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center gap-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            {t("title")}
          </h2>
          <p className="max-w-[700px] text-lg text-muted-foreground md:text-xl">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Feature 1 */}
          <Card className="relative overflow-hidden border-primary/20 transition-all hover:shadow-md">
            <CardHeader className="pb-4">
              <div className="mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t("chatToResume.title")}</CardTitle>
              <CardDescription>{t("chatToResume.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {getFeatures("chatToResume").map(
                  (feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  )
                )}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/resume-builder-demo">
                <Button className="w-full gap-2">
                  {t("chatToResume.button")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Feature 2 */}
          <Card className="border-primary/20 transition-all hover:shadow-md">
            <CardHeader className="pb-4">
              <div className="mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t("mockInterview.title")}</CardTitle>
              <CardDescription>
                {t("mockInterview.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {getFeatures("mockInterview").map(
                  (feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  )
                )}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/mock-interviews">
                <Button className="w-full gap-2">
                  {t("mockInterview.button")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Feature 3 */}
          <Card className="border-primary/20 transition-all hover:shadow-md">
            <CardHeader className="pb-4">
              <div className="mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t("interviewCopilot.title")}</CardTitle>
              <CardDescription>
                {t("interviewCopilot.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {getFeatures("interviewCopilot").map(
                  (feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  )
                )}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/interview-copilot-demo">
                <Button className="w-full gap-2">
                  {t("interviewCopilot.button")}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
