import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export default function EqualizerBars() {
  const { theme } = useTheme();
  const bars = [18, 24, 14, 30, 16, 22, 12, 26];

  return (
    <div className="flex items-end gap-1.5">
      {bars.map((height, index) => (
        <motion.span
          key={index}
          className="w-1.5 rounded-full"
          style={{ backgroundColor: theme.palette.accent }}
          animate={{
            height: [8, height, 10, height - 6, 8],
            opacity: [0.4, 1, 0.7, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.08,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
