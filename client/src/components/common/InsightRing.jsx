import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function InsightRing({ value }) {
  const { theme } = useTheme();
  const progress = useMotionValue(0);
  const rounded = useTransform(progress, (latest) => Math.round(latest));
  const stroke = 2 * Math.PI * 46;
  const progressOffset = useTransform(progress, (latest) => {
    return stroke - (stroke * latest) / 100;
  });

  useEffect(() => {
    const controls = animate(progress, value, {
      duration: 1.4,
      ease: "easeInOut",
    });
    return () => controls.stop();
  }, [progress, value]);

  return (
    <div className="relative mx-auto h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r="46"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="10"
          fill="none"
        />
        <motion.circle
          cx="60"
          cy="60"
          r="46"
          stroke={theme.palette.accent}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={stroke}
          style={{ strokeDashoffset: progressOffset }}
        />
      </svg>
      <motion.div
        className="absolute inset-0 flex items-center justify-center text-3xl font-bold"
        style={{ color: theme.palette.text }}
      >
        <motion.span>{rounded}</motion.span>
      </motion.div>
    </div>
  );
}
