import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export default function GlowButton({
  children,
  className = "",
  onClick,
  disabled = false,
  type = "button",
  variant = "primary",
}) {
  const { theme } = useTheme();
  const [ripple, setRipple] = useState(null);

  const handlePress = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setRipple({ x, y, key: Date.now() });
    if (onClick) onClick(event);
  };

  const isGhost = variant === "ghost";

  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={{ scale: 1.025, y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={handlePress}
      className={`relative overflow-hidden rounded-full px-6 py-3 text-sm font-semibold text-white shadow-xl disabled:cursor-not-allowed ${className}`}
      style={
        isGhost
          ? {
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${theme.palette.border}`,
              boxShadow: "none",
            }
          : {
              background: theme.palette.button,
              boxShadow: `0 12px 32px -8px ${theme.palette.accentSoft}, 0 1px 0 0 rgba(255,255,255,0.18) inset`,
            }
      }
    >
      {/* inner highlight */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-full opacity-50"
        style={{ background: "rgba(255,255,255,0.5)" }}
      />
      {ripple && (
        <motion.span
          key={ripple.key}
          initial={{ opacity: 0.5, scale: 0 }}
          animate={{ opacity: 0, scale: 14 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="absolute h-5 w-5 rounded-full bg-white/50"
          style={{ left: ripple.x - 10, top: ripple.y - 10 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

