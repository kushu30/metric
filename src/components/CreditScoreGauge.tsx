"use client";

import { motion } from "framer-motion";

interface CreditScoreGaugeProps {
  score: number;
}

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CreditScoreGauge({ score }: CreditScoreGaugeProps) {
  const scoreProgress = score / 100;
  const strokeDashoffset = CIRCUMFERENCE * (1 - scoreProgress);

  const getColor = () => {
    if (score >= 80) return "#22c55e"; // green-500
    if (score >= 50) return "#facc15"; // yellow-400
    return "#ef4444"; // red-500
  };
  const color = getColor();

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
        {/* Background Circle */}
        <circle
          cx="100"
          cy="100"
          r={RADIUS}
          stroke="#e5e7eb" // gray-200
          strokeWidth="15"
          fill="transparent"
        />
        {/* Progress Circle */}
        <motion.circle
          cx="100"
          cy="100"
          r={RADIUS}
          stroke={color}
          strokeWidth="15"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-5xl font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {score}
        </motion.span>
        <p className="text-sm text-gray-500">Credit Score</p>
      </div>
    </div>
  );
}