import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export default function AuraBackground() {
  const { theme } = useTheme();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          background: theme.palette.bg,
          backgroundSize: "200% 200%",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 50%", "0% 100%"],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute -left-12 top-24 h-44 w-44 rounded-full blur-3xl"
        style={{ backgroundColor: theme.palette.blobA }}
        animate={{
          x: [0, 26, -8, 0],
          y: [0, -20, 12, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute -right-14 bottom-16 h-56 w-56 rounded-full blur-3xl"
        style={{ backgroundColor: theme.palette.blobB }}
        animate={{
          x: [0, -26, 14, 0],
          y: [0, 18, -8, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
