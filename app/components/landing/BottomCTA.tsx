"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export const BottomCTA = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[1080px] mx-auto py-24 px-4 text-center"
    >
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
        Get Started For Free
      </h2>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
        With Perfect Interview, you can maximize your chances of getting hired
      </p>
      <Link href="/sign-in">
        <Button size="lg" className="px-8 py-6 text-lg">
          Start Now
        </Button>
      </Link>
    </motion.div>
  );
};
