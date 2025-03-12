"use client";

import CTA from "./CTA";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { User } from "@supabase/supabase-js";

export default function ChatToResume({ user }: { user: User | null }) {
  const t = useTranslations("resumeBuilder.landingPage");

  // Testimonials data
  const testimonials = [
    {
      name: "Michael C.",
      role: "Software Engineer",
      quote:
        "This was the easiest resume I've ever made in my life. 10/10 experience, can't recommend enough.",
      initials: "MC",
    },
    {
      name: "Emily R.",
      role: "Marketing Manager",
      quote: "Talking to build a resume >>>>> typing to build a resume.",
      initials: "ER",
    },
    {
      name: "David K.",
      role: "Data Scientist",
      quote:
        "Love how well the AI assistant was able to transform my random thoughts into a really high quality resume.",
      initials: "DK",
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start px-4 py-16 bg-background">
      <div className="max-w-6xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            {t("stats.users")}
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent animate-gradient-x">
            {t("title")}
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {t("description")}
          </p>

          <div className="pt-4">
            <CTA user={user} />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl border bg-card shadow-sm"
          >
            <MessageSquare className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {t("features.conversation.title")}
            </h3>
            <p className="text-muted-foreground">
              {t("features.conversation.description")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl border bg-card shadow-sm"
          >
            <Sparkles className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {t("features.formatting.title")}
            </h3>
            <p className="text-muted-foreground">
              {t("features.formatting.description")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl border bg-card shadow-sm"
          >
            <Clock className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {t("features.time.title")}
            </h3>
            <p className="text-muted-foreground">
              {t("features.time.description")}
            </p>
          </motion.div>
        </div>

        {/* Demo Video */}
        <div className="mb-16 rounded-xl overflow-hidden shadow-xl border border-border">
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

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t("testimonials.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-6 rounded-xl border bg-card shadow-sm"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {testimonial.initials}
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-primary/5 rounded-3xl p-12"
        >
          <h2 className="text-3xl font-bold mb-4">
            {t("testimonials.cta.title")}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("testimonials.cta.description")}
          </p>
          <CTA user={user} />
        </motion.div>
      </div>
    </div>
  );
}
