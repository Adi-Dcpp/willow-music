import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export default function GlassCard({ className = "", children, hover = true }) {
  const { theme } = useTheme();

  return (
    <motion.div
      whileHover={hover ? { scale: 1.03, y: -2 } : undefined}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`rounded-3xl border backdrop-blur-xl shadow-xl ${className}`}
      style={{
        background: theme.palette.card,
        borderColor: theme.palette.border,
        boxShadow: `0 16px 44px -24px ${theme.palette.accentSoft}`,
      }}
    >
      {children}
    </motion.div>
  );
}
