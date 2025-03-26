import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const LandingHero = () => {
  return (
    <div className="w-full max-w-[1080px] mx-auto px-4 py-16 flex flex-col items-center text-center">
      <motion.h1
        className="text-5xl md:text-6xl font-bold tracking-tight"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        We Make Tools To Help You Get A Job
      </motion.h1>

      <motion.p
        className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-3xl"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Create perfect resumes, go through practice interviews, and get
        real-time interview assistance with our suite of tools.
      </motion.p>

      <motion.div
        className="flex flex-col sm:flex-row gap-4 mt-8"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Button size="lg">Get Started</Button>
      </motion.div>

      <motion.p
        className="mt-12 text-muted-foreground"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        Trusted by 3,000+ job seekers
      </motion.p>
    </div>
  );
};
