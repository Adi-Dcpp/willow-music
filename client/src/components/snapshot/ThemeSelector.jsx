import { motion } from "framer-motion";
import { THEMES } from "../../lib/themes";
import { useTheme } from "../../context/ThemeContext";
import GlassCard from "../common/GlassCard";

export default function ThemeSelector() {
  const { themeId, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-2 gap-3">
      {THEMES.map((theme, index) => {
        const active = theme.id === themeId;
        return (
          <motion.button
            key={theme.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.35 }}
            whileHover={{ y: -2, scale: 1.02 }}
            onClick={() => setTheme(theme.id)}
            className="text-left"
          >
            <GlassCard
              className={`p-3 ${active ? "ring-2" : ""}`}
              hover={false}
            >
              <div
                className="mb-2 h-16 rounded-2xl border"
                style={{
                  background: theme.palette.bg,
                  borderColor: theme.palette.border,
                  boxShadow: `inset 0 0 24px ${theme.palette.accentSoft}`,
                }}
              />
              <p className="text-sm font-semibold text-white">
                {theme.emoji} {theme.label}
              </p>
            </GlassCard>
          </motion.button>
        );
      })}
    </div>
  );
}
