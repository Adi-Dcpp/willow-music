import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GlowButton from "../components/common/GlowButton";
import FooterLinks from "../components/common/FooterLinks";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const getApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (apiUrl) {
    return apiUrl;
  }

  if (import.meta.env.DEV) {
    return "http://127.0.0.1:5000/api";
  }

  throw new Error("VITE_API_URL must be set in production");
};

const features = [
  { icon: "🎭", label: "Music Identity" },
  { icon: "🧠", label: "Taste Insights" },
  { icon: "📸", label: "Shareable Aura" },
  { icon: "🎵", label: "Top Music Signals" },
];
// Guard against slow Render cold-starts (typically < 5 s); reset the button
// after this window so users can retry if the redirect genuinely stalled.
const REDIRECT_TIMEOUT_MS = 8000;

const SpotifyLogo = () => (
  <svg viewBox="0 0 168 168" className="h-5 w-5 shrink-0" fill="currentColor">
    <path d="M84 0a84 84 0 1 0 84 84A84 84 0 0 0 84 0Zm38.5 121.2a5.2 5.2 0 0 1-7.2 1.7c-19.8-12.1-44.7-14.8-74-8.2a5.2 5.2 0 1 1-2.3-10.2c32-7.2 59.6-4 81.8 9.6a5.2 5.2 0 0 1 1.7 7.1Zm10.2-21.9a6.6 6.6 0 0 1-9.1 2.2c-22.7-14-57.2-18.1-84-10a6.6 6.6 0 1 1-3.9-12.6c30.7-9.5 69.1-5 94.8 11.1a6.6 6.6 0 0 1 2.2 9.3Zm1-22.8C106.8 59 62.4 57.8 36.8 65.6a8 8 0 1 1-4.7-15.3c29.5-9 78.4-7.5 109.6 12a8 8 0 1 1-8 13.7Z" />
  </svg>
);

export default function LoginPage() {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(
    window.localStorage.getItem("willow_oauth_inflight") === "1"
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onLogin = () => {
    if (isRedirecting || isAuthenticated) {
      if (isAuthenticated) {
        navigate("/dashboard", { replace: true });
      }
      return;
    }

    setIsRedirecting(true);
    window.localStorage.setItem("willow_oauth_inflight", "1");
    window.setTimeout(() => {
      setIsRedirecting(false);
      window.localStorage.removeItem("willow_oauth_inflight");
    }, REDIRECT_TIMEOUT_MS);
    window.location.href = `${getApiBaseUrl()}/auth/spotify/login`;
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-12">
      {/* Decorative ring behind content */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{
          width: 520,
          height: 520,
          borderColor: theme.palette.border,
          opacity: 0.25,
        }}
        animate={{ scale: [1, 1.04, 1], opacity: [0.18, 0.28, 0.18] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{
          width: 760,
          height: 760,
          borderColor: theme.palette.border,
          opacity: 0.1,
        }}
        animate={{ scale: [1, 1.03, 1], opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative z-10 mx-auto w-full max-w-sm text-center">
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border text-3xl"
            style={{
              borderColor: theme.palette.border,
              background: theme.palette.card,
              boxShadow: `0 0 48px ${theme.palette.accentSoft}, 0 0 80px ${theme.palette.accentSoft}`,
            }}
          >
            🌿
          </motion.div>
        </motion.div>

        {/* Hero copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: theme.palette.accent }}
          >
            Willow
          </p>
          <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-white">
            Every Era
            <br />
            <span
              className="text-gradient"
              style={{ backgroundImage: theme.palette.button }}
            >
              Has a Sound
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed" style={{ color: theme.palette.muted }}>
            Your Spotify listening history transformed into a{" "}
            <span className="font-semibold text-white/90">living music identity</span> — personal,
            visual, shareable.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {features.map((f, i) => (
            <motion.span
              key={f.label}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-white/80"
              style={{
                borderColor: theme.palette.border,
                background: theme.palette.card,
              }}
            >
              <span>{f.icon}</span>
              {f.label}
            </motion.span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10"
        >
          <GlowButton className="w-full py-4 text-base" onClick={onLogin} disabled={isRedirecting}>
            <span className="inline-flex items-center justify-center gap-2.5">
              <SpotifyLogo />
              {isRedirecting ? "Redirecting to Spotify..." : "Continue with Spotify"}
            </span>
          </GlowButton>

          {location.state?.from ? (
            <p className="mt-3 text-xs" style={{ color: theme.palette.muted }}>
              Sign in to continue to {location.state.from}
            </p>
          ) : (
            <p className="mt-3 text-xs" style={{ color: theme.palette.muted }}>
              Free · No credit card · Instant access
            </p>
          )}
        </motion.div>
      </div>

      <div className="relative z-10 mt-auto pt-16 w-full">
        <FooterLinks />
      </div>
    </div>
  );
}
