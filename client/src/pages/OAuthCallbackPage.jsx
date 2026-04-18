import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/common/GlassCard";
import GlowButton from "../components/common/GlowButton";
import { InlineLoader } from "../components/common/StatePanel";
import { useAuth } from "../context/AuthContext";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshSession, clearSession } = useAuth();
  const [error, setError] = useState("");
  const hasFinalized = useRef(false);

  useEffect(() => {
    if (hasFinalized.current) {
      return;
    }

    const finalize = async () => {
      hasFinalized.current = true;

      try {
        const user = await refreshSession();
        if (user) {
          navigate("/dashboard", { replace: true });
          return;
        }

        navigate("/dashboard", { replace: true });
      } catch {
        clearSession();
        setError("Could not complete login.");
      } finally {
        window.history.replaceState({}, "", window.location.pathname);
      }
    };

    finalize();
  }, [clearSession, navigate, refreshSession]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-105 flex-col justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
      >
        <GlassCard className="p-6 text-center" hover={false}>
          {!error ? (
            <InlineLoader text="Finalizing your Spotify session..." />
          ) : (
            <>
              <h1 className="text-xl font-semibold text-white">Login failed</h1>
              <p className="mt-2 text-sm text-white/70">{error}</p>
              <GlowButton className="mt-5 w-full" onClick={() => navigate("/", { replace: true })}>
                Back to login
              </GlowButton>
            </>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
