import { motion } from "framer-motion";
import { Music2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import GlowButton from "../components/common/GlowButton";
import GlassCard from "../components/common/GlassCard";
import FooterLinks from "../components/common/FooterLinks";
import { useTheme } from "../context/ThemeContext";

export default function LoginPage() {
  const { theme } = useTheme();
  const location = useLocation();

  const onLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/spotify/login`;
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <GlassCard className="p-6 text-center">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border"
            style={{
              borderColor: theme.palette.border,
              boxShadow: `0 0 30px ${theme.palette.accentSoft}`,
            }}
          >
            <Music2 color={theme.palette.accent} />
          </motion.div>

          <h1 className="text-3xl font-semibold text-white">
            Discover your music soul 🌿
          </h1>
          <p className="mt-2 text-sm" style={{ color: theme.palette.muted }}>
            Willow transforms your Spotify taste into a living aura.
          </p>

          <div className="mt-6">
            <GlowButton className="w-full" onClick={onLogin}>
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 168 168" className="h-5 w-5" fill="currentColor">
                  <path d="M84 0a84 84 0 1 0 84 84A84 84 0 0 0 84 0Zm38.5 121.2a5.2 5.2 0 0 1-7.2 1.7c-19.8-12.1-44.7-14.8-74-8.2a5.2 5.2 0 1 1-2.3-10.2c32-7.2 59.6-4 81.8 9.6a5.2 5.2 0 0 1 1.7 7.1Zm10.2-21.9a6.6 6.6 0 0 1-9.1 2.2c-22.7-14-57.2-18.1-84-10a6.6 6.6 0 1 1-3.9-12.6c30.7-9.5 69.1-5 94.8 11.1a6.6 6.6 0 0 1 2.2 9.3Zm1-22.8C106.8 59 62.4 57.8 36.8 65.6a8 8 0 1 1-4.7-15.3c29.5-9 78.4-7.5 109.6 12a8 8 0 1 1-8 13.7Z" />
                </svg>
                Continue with Spotify
              </span>
            </GlowButton>
          </div>
        </GlassCard>
      </motion.div>

      {location.state?.from ? (
        <p className="mt-4 text-center text-xs text-white/65">
          Sign in to continue to {location.state.from}
        </p>
      ) : null}

      <FooterLinks />
    </div>
  );
}
