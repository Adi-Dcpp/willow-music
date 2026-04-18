import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export default function GlowButton({
  children,
  className = "",
  onClick,
  disabled = false,
  type = "button",
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

  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      onClick={handlePress}
      className={`relative overflow-hidden rounded-full px-5 py-3 text-sm font-semibold text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      style={{
        background: theme.palette.button,
        boxShadow: `0 16px 32px -12px ${theme.palette.accentSoft}`,
      }}
    >
      {ripple && (
        <motion.span
          key={ripple.key}
          initial={{ opacity: 0.6, scale: 0 }}
          animate={{ opacity: 0, scale: 12 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute h-5 w-5 rounded-full bg-white/60"
          style={{ left: ripple.x - 10, top: ripple.y - 10 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
