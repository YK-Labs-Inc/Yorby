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
import MuxPlayer from "@mux/mux-player-react";
import { ArrowRight, Play, CheckCircle, ArrowDown } from "lucide-react";

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
          <div className="text-2xl font-bold text-gray-900">YourView</div>
          <div className="flex items-center gap-8">
            <Link
              href="#pricing"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
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
            className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Replace expensive recruiting tools with our forever-free ATS. Add AI
            interviews to screen every applicant and surface talent you'd
            otherwise overlook.
          </motion.p>

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
              <p className="text-lg text-gray-600 mb-8">
                Replace expensive tools like Greenhouse, Lever, or BambooHR with
                our completely free, open-source ATS. No catch, no limits.
              </p>
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
            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                100%
              </div>
              <div className="text-gray-600">Open source & free forever</div>
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
            className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto"
          >
            Join startups using YourView to hire better talent, faster than ever
            before
          </motion.p>

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
