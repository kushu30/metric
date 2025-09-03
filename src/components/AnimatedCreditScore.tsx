"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface AnimatedCreditScoreProps {
  score: number | null;
}

export default function AnimatedCreditScore({ score }: AnimatedCreditScoreProps) {
  const spring = useSpring(score ?? 0, { mass: 0.8, stiffness: 100, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(score ?? 0);
  }, [spring, score]);

  return (
    <motion.p className="text-5xl font-bold text-blue-600">
      {score === null ? "N/A" : display}
    </motion.p>
  );
}