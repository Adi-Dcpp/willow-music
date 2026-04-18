import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export default function GlassCard({ className = "", children, hover = true, style = {} }) {
  const { theme } = useTheme();

  return (
    <motion.div
      whileHover={hover ? { scale: 1.025, y: -3 } : undefined}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`glass-highlight relative rounded-3xl border backdrop-blur-2xl shadow-xl ${className}`}
      style={{
        background: theme.palette.card,
        borderColor: theme.palette.border,
        boxShadow: `0 20px 48px -20px ${theme.palette.accentSoft}, 0 1px 0 0 rgba(255,255,255,0.06) inset`,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

