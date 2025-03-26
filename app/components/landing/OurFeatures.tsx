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

export default function OurFetures() {
  return (
    <section id="features" className="py-20 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center gap-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Our AI-Powered Tools
          </h2>
          <p className="max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Three powerful tools to help you at every stage of your job search
            journey
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Feature 1 */}
          <Card className="relative overflow-hidden border-primary/20 transition-all hover:shadow-md">
            <CardHeader className="pb-4">
              <div className="mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Chat to Resume</CardTitle>
              <CardDescription>
                Create a perfect resume through natural conversation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {[
                  "Natural voice or text input",
                  "AI-powered formatting",
                  "Continuous editing",
                  "ATS-optimized templates",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/resume-builder-demo">
                <Button className="w-full gap-2">
                  Try Resume Builder Demo
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
              <CardTitle>Mock Interview</CardTitle>
              <CardDescription>
                Practice with AI-generated interview questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {[
                  "Job-specific questions",
                  "Real-time feedback",
                  "Performance analysis",
                  "Unlimited practice sessions",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/mock-interviews">
                <Button className="w-full gap-2">
                  Try Mock Interview Demo
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
              <CardTitle>Interview Co-pilot</CardTitle>
              <CardDescription>
                Real-time assistance during actual interviews
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {[
                  "Live transcription",
                  "Question detection",
                  "Answer suggestions",
                  "Document integration",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/interview-copilot-demo">
                <Button className="w-full gap-2">
                  Try Interview Co-pilot Demo <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
