"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MuxPlayer from "@mux/mux-player-react";
import {
  ArrowRight,
  Play,
  CheckCircle,
  ArrowDown,
  Mic,
  Sparkles,
} from "lucide-react";
import { DemoInterviewComponent } from "./DemoInterviewComponent";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function B2BLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <FeatureShowcase />
      <InteractiveDemoSection />
      <ATSSection />
      <ProductDemo />
      <SimplePricing />
      <FinalCTA />
    </div>
  );
}

const VideoModal = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>Product Demo</DialogTitle>
        </DialogHeader>
        <div className="aspect-video w-full">
          <MuxPlayer
            playbackId="g5K01igrsORGlj1i01EZulUz3owWFpyASJUzFrRN2YqJs"
            className="w-full h-full rounded-lg"
            autoPlay
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Navigation = () => {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-900">Yorby</div>
          <div className="flex items-center gap-8">
            <Link
              href="#pricing"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="https://github.com/YK-Labs-INC/Yorby"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
              Open Source
            </Link>
            <Link href="/auth/login">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

const InteractiveDemoSection = () => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return null;
  }

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Live Demo Available
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Try the AI Interviewer
            <br />
            <span className="text-blue-600">Right Now</span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-600 max-w-2xl mx-auto mb-12"
          >
            Experience firsthand how our AI conducts natural voice interviews.
            No sign-up required — just click and start talking.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex justify-center">
            <Dialog open={isDemoOpen} onOpenChange={setIsDemoOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="group px-10 py-8 text-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200"
                >
                  <Mic className="mr-3 w-6 h-6 animate-pulse" />
                  Start Live Demo Interview
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full p-0 bg-transparent border-0">
                <div className="w-full h-full bg-white rounded-lg overflow-hidden">
                  <DemoInterviewComponent />
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>No sign-up needed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>2-minute demo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>See instant AI analysis</span>
            </div>
          </motion.div>

          {/* Visual Demo Preview */}
          <motion.div
            variants={fadeInUp}
            className="mt-16 relative max-w-4xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-3xl opacity-20"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-sm text-gray-400">
                  Live AI Interview Demo
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mic className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          AI Interviewer
                        </p>
                        <p className="text-xs text-gray-500">Ready to start</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      "Tell me about your experience with team leadership..."
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">👤</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">You</p>
                        <p className="text-xs text-gray-500">Speaking...</p>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full animate-pulse"
                        style={{ width: "60%" }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Real-time Analysis
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Communication</span>
                      <span className="text-green-600 font-medium">
                        Excellent
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Technical Skills</span>
                      <span className="text-blue-600 font-medium">Strong</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Culture Fit</span>
                      <span className="text-purple-600 font-medium">
                        Good Match
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">AI confidence: 92%</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const HeroSection = () => {
  return (
    <section className="pb-8 px-6 pt-32">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.h1
            variants={fadeInUp}
            className="text-6xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8 leading-tight"
          >
            Stop missing
            <br />
            <span className="text-blue-600">great candidates</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Replace expensive recruiting tools with our forever-free,
            open-source ATS. Add AI interviews to screen every applicant and
            surface talent you'd otherwise overlook.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center gap-2 mb-12"
          >
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
              <GithubIcon className="w-4 h-4" />
              100% Open Source
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link href="/auth/login">
              <Button
                size="lg"
                className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700"
              >
                Start with free ATS
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <VideoModal>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg border-gray-300 hover:bg-gray-50"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch demo
              </Button>
            </VideoModal>
          </motion.div>
          <motion.div variants={fadeInUp} className="mt-12 flex justify-center">
            <ArrowDown className="w-6 h-6 text-gray-400 animate-bounce" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const ProductDemo = () => {
  return (
    <section id="demo" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeInUp}
            className="text-5xl font-bold text-gray-900 mb-6"
          >
            See AI interviews in action
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Watch how our AI interviewer conducts natural conversations and
            provides instant candidate analysis
          </motion.p>
        </motion.div>

        <motion.div
          className="grid lg:grid-cols-2 gap-16 items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div variants={fadeInUp} className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Candidate applies to your job
                  </h3>
                  <p className="text-gray-600">
                    They upload their resume through your branded application
                    page
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    AI conducts voice interview
                  </h3>
                  <p className="text-gray-600">
                    Using your custom questions, AI has a natural conversation
                    with each candidate
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Get ranked results instantly
                  </h3>
                  <p className="text-gray-600">
                    Review analysis, transcripts, and focus only on top
                    performers
                  </p>
                </div>
              </div>
            </div>

            <VideoModal>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Play className="mr-2 w-4 h-4" />
                Watch full demo
              </Button>
            </VideoModal>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-8">
            {/* AI Interview Demo */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
              <div className="text-sm text-blue-600 mb-3">
                AI Interview in Progress
              </div>
              <div className="bg-white rounded-lg overflow-hidden">
                <img
                  src="/assets/yorby-interview-screenshot.png"
                  alt="AI Interview Demo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Candidate Analysis */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
              <div className="text-sm text-green-600 mb-3">
                Candidate Analysis
              </div>
              <div className="bg-white rounded-lg overflow-hidden">
                <img
                  src="/assets/yorby-candidate-analysis-screenshot.png"
                  alt="Candidate Analysis Dashboard"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const ATSSection = () => {
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeInUp}
            className="text-5xl font-bold text-gray-900 mb-6"
          >
            Free ATS for Startups
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Built specifically for startups who need enterprise-grade recruiting
            tools without the enterprise price tag
          </motion.p>
        </motion.div>

        <motion.div
          className="grid lg:grid-cols-2 gap-16 items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div variants={fadeInUp}>
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg">
              <img
                src="/assets/yorby-ats-screenshot.png"
                alt="Free ATS Dashboard"
                className="w-full rounded-lg"
              />
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-8">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Everything you'd pay $10,000+ for
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Replace expensive tools like Greenhouse, Lever, or BambooHR with
                our completely free, open-source ATS. No catch, no limits.
              </p>

              <div className="flex items-center gap-4 mb-8">
                <Link
                  href="https://github.com/YK-Labs-INC/Yorby"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <GithubIcon className="w-4 h-4" />
                  View source code on GitHub
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Unlimited Everything
                  </h4>
                  <p className="text-gray-600">
                    No limits on job postings, candidates, or team members.
                    Scale from 1 to 1000 employees without paying a dime.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Complete Pipeline Management
                  </h4>
                  <p className="text-gray-600">
                    Customizable hiring stages, candidate tracking, team
                    collaboration, and all the features you expect from premium
                    ATS systems.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Open Source & Self-Hostable
                  </h4>
                  <p className="text-gray-600">
                    Own your data completely. Deploy on your infrastructure or
                    use our hosted version. Full transparency, no vendor
                    lock-in.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Perfect for Lean Teams
                  </h4>
                  <p className="text-gray-600">
                    Spend your runway on growth, not recruiting software. Get
                    enterprise features without the enterprise cost structure.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link href="/auth/login">
                <Button
                  size="lg"
                  className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700"
                >
                  Start using free ATS
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="mt-20 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div
            variants={fadeInUp}
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <div className="text-4xl font-bold text-green-600 mb-2">$0</div>
              <div className="text-gray-600">Setup & monthly cost</div>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-2">∞</div>
              <div className="text-gray-600">Candidates & job posts</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const FeatureShowcase = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeInUp}
            className="text-5xl font-bold text-gray-900 mb-6"
          >
            Everything you need
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Free ATS foundation with powerful AI interview add-ons
          </motion.p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div variants={fadeInUp} className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <div className="text-sm text-blue-600 mb-3">Free ATS</div>
              <div className="bg-white rounded-lg overflow-hidden h-48">
                <img
                  src="/assets/yorby-ats-screenshot.png"
                  alt="ATS Interface"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Complete ATS Platform
              </h3>
              <p className="text-gray-600">
                Job posting, candidate tracking, team collaboration. Everything
                Greenhouse does, for free.
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-6">
            <div className="bg-green-50 p-6 rounded-2xl">
              <div className="text-sm text-green-600 mb-3">AI Interviews</div>
              <div className="bg-white rounded-lg overflow-hidden h-48">
                <img
                  src="/assets/yorby-interview-screenshot.png"
                  alt="AI Interview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Voice AI Interviewer
              </h3>
              <p className="text-gray-600">
                Natural conversations with every candidate. Works 24/7, speaks
                any language.
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-6">
            <div className="bg-purple-50 p-6 rounded-2xl">
              <div className="text-sm text-purple-600 mb-3">Smart Analysis</div>
              <div className="bg-white rounded-lg overflow-hidden h-48">
                <img
                  src="/assets/yorby-candidate-analysis-screenshot.png"
                  alt="Analysis Report"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Automated Analysis
              </h3>
              <p className="text-gray-600">
                Detailed insights on every candidate. See strengths, concerns,
                and hiring recommendations.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const SimplePricing = () => {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeInUp}
            className="text-5xl font-bold text-gray-900 mb-6"
          >
            Simple pricing
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-gray-600 mb-16">
            Start free, scale when you're ready
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {/* Free ATS */}
            <div className="bg-gradient-to-b from-gray-50 to-white p-8 rounded-3xl border-2 border-gray-200">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Free ATS
                </h3>
                <p className="text-gray-600">Complete recruiting platform</p>
              </div>

              <div className="text-5xl font-bold text-gray-900 mb-6">
                $0<span className="text-xl text-gray-500">/month</span>
              </div>

              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Unlimited job postings</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Unlimited candidates</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Full ATS features</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Team collaboration</span>
                </div>
              </div>

              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-lg border-gray-300"
                >
                  Start free ATS
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* AI Interviews */}
            <div className="bg-gradient-to-b from-blue-50 to-white p-8 rounded-3xl border-2 border-blue-200 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  AI Interviews
                </h3>
                <p className="text-gray-600">AI-powered candidate screening</p>
              </div>

              <div className="text-5xl font-bold text-gray-900 mb-2">
                $99<span className="text-xl text-gray-500">/month</span>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                200 interviews included
              </p>

              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Everything in Free ATS</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">200 AI interviews/month</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Voice AI interviewer</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Automated analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">
                    $0.50 per additional interview
                  </span>
                </div>
              </div>

              <Link href="/auth/login">
                <Button
                  size="lg"
                  className="w-full text-lg bg-blue-600 hover:bg-blue-700"
                >
                  Start with AI interviews
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              No credit card required • Cancel anytime
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const FinalCTA = () => {
  return (
    <section className="py-24 bg-gray-900 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeInUp}
            className="text-5xl font-bold text-white mb-6"
          >
            Ready to find your next great hire?
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            Join startups using Yorby to hire better talent, faster than ever
            before
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center gap-4 mb-12"
          >
            <Link
              href="https://github.com/YK-Labs-INC/Yorby"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
              <span className="text-sm">Open Source on GitHub</span>
            </Link>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/login">
              <Button
                size="lg"
                className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700"
              >
                Start with free ATS
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <VideoModal>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch demo
              </Button>
            </VideoModal>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
