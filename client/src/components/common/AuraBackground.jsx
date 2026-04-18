import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export default function AuraBackground() {
  const { theme } = useTheme();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden noise-overlay">
      {/* Base gradient */}
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
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob A — top-left */}
      <motion.div
        className="absolute -left-20 -top-10 h-72 w-72 rounded-full blur-[96px]"
        style={{ backgroundColor: theme.palette.blobA }}
        animate={{
          x: [0, 36, -14, 0],
          y: [0, -28, 18, 0],
          scale: [1, 1.18, 0.92, 1],
          opacity: [0.55, 0.7, 0.5, 0.55],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob B — bottom-right */}
      <motion.div
        className="absolute -bottom-16 -right-20 h-80 w-80 rounded-full blur-[96px]"
        style={{ backgroundColor: theme.palette.blobB }}
        animate={{
          x: [0, -32, 18, 0],
          y: [0, 24, -14, 0],
          scale: [1, 0.88, 1.12, 1],
          opacity: [0.5, 0.65, 0.45, 0.5],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob C — center subtle */}
      <motion.div
        className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full blur-[80px]"
        style={{ backgroundColor: theme.palette.blobA }}
        animate={{
          scale: [0.8, 1.1, 0.85, 1],
          opacity: [0.15, 0.28, 0.12, 0.15],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob D — top-right accent */}
      <motion.div
        className="absolute -right-8 top-16 h-48 w-48 rounded-full blur-[72px]"
        style={{ backgroundColor: theme.palette.blobB }}
        animate={{
          x: [0, -18, 8, 0],
          y: [0, 14, -10, 0],
          scale: [0.9, 1.05, 0.85, 0.9],
          opacity: [0.3, 0.45, 0.25, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </div>
  );
}

