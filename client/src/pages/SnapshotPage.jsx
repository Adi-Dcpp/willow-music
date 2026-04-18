import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import GlassCard from "../components/common/GlassCard";
import GlowButton from "../components/common/GlowButton";
import { ErrorState, InlineLoader } from "../components/common/StatePanel";
import ThemeSelector from "../components/snapshot/ThemeSelector";
import { useTheme } from "../context/ThemeContext";

const timeRanges = [
  {
    id: "short_term",
    label: "Last 4 Weeks",
    subtitle: "Your current obsession",
    icon: "🔥",
  },
  {
    id: "medium_term",
    label: "Last 6 Months",
    subtitle: "Your evolving taste",
    icon: "🌙",
  },
  {
    id: "long_term",
    label: "All Time",
    subtitle: "Your musical soul",
    icon: "⭐",
  },
];

const steps = ["Time Range", "Theme", "Generate"];

export default function SnapshotPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [timeRange, setTimeRange] = useState("medium_term");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const { theme, themeId } = useTheme();

  const createSnapshot = async () => {
    try {
      setError("");
      setIsCreating(true);

      const response = await api.post("/share", {
        timeRange,
        theme: themeId,
      });

      const shareId = response.data?.data?.shareId;
      if (!shareId) {
        throw new Error("Share id missing");
      }

      const themeMapRaw = window.localStorage.getItem("willow-snapshot-themes");
      const themeMap = themeMapRaw ? JSON.parse(themeMapRaw) : {};
      themeMap[shareId] = themeId;
      window.localStorage.setItem("willow-snapshot-themes", JSON.stringify(themeMap));

      setIsCreating(false);
      navigate(`/share/${shareId}`);
    } catch (err) {
      setIsCreating(false);
      setError(err?.response?.data?.message || "Could not create snapshot right now.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32 pt-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <p
          className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.palette.accent }}
        >
          Snapshot
        </p>
        <h1 className="text-3xl font-bold text-white">Lock Your Vibe</h1>
        <p className="mt-2 text-sm" style={{ color: theme.palette.muted }}>
          Capture your music identity and share it with the world.
        </p>
      </motion.div>

      {/* Step indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-7 flex items-center justify-center gap-0"
      >
        {steps.map((label, i) => {
          const num = i + 1;
          const done = step > num;
          const active = step === num;
          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  animate={
                    done
                      ? { scale: [1, 1.15, 1] }
                      : active
                      ? { scale: [1, 1.08, 1] }
                      : {}
                  }
                  transition={{ duration: 0.4 }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{
                    background: done || active ? theme.palette.button : "rgba(255,255,255,0.08)",
                    border: `1px solid ${done || active ? "transparent" : theme.palette.border}`,
                    boxShadow: active ? `0 0 16px ${theme.palette.accentSoft}` : "none",
                  }}
                >
                  {done ? <Check size={12} /> : num}
                </motion.div>
                <span
                  className="text-[9px] font-medium uppercase tracking-wider"
                  style={{ color: active ? theme.palette.accent : "rgba(255,255,255,0.35)" }}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="mx-3 mb-4 h-px w-10"
                  style={{
                    background:
                      step > num + 1
                        ? theme.palette.accent
                        : step > num
                        ? `linear-gradient(90deg, ${theme.palette.accent}, rgba(255,255,255,0.12))`
                        : "rgba(255,255,255,0.1)",
                  }}
                />
              )}
            </div>
          );
        })}
      </motion.div>

      {error ? (
        <div className="mb-5">
          <ErrorState title="Snapshot failed" message={error} onRetry={createSnapshot} />
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {/* Step 1 – Time Range */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassCard className="p-5" hover={false}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
                Step 1
              </p>
              <h2 className="mb-4 text-lg font-bold text-white">Choose Your Era</h2>
              <div className="space-y-2.5">
                {timeRanges.map((item) => {
                  const active = timeRange === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTimeRange(item.id)}
                      className="group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all"
                      style={{
                        borderColor: active ? theme.palette.accent : theme.palette.border,
                        background: active ? `${theme.palette.accentSoft}` : "rgba(255,255,255,0.03)",
                        boxShadow: active ? `0 0 20px ${theme.palette.accentSoft}` : "none",
                      }}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{item.label}</p>
                        <p className="text-xs" style={{ color: theme.palette.muted }}>
                          {item.subtitle}
                        </p>
                      </div>
                      <motion.div
                        animate={{ scale: active ? 1 : 0, opacity: active ? 1 : 0 }}
                        className="flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ background: theme.palette.button }}
                      >
                        <Check size={10} className="text-white" />
                      </motion.div>
                    </motion.button>
                  );
                })}
              </div>
              <div className="mt-5 flex justify-end">
                <GlowButton onClick={() => setStep(2)}>
                  Next: Pick Theme →
                </GlowButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 2 – Theme */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassCard className="p-5" hover={false}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
                Step 2
              </p>
              <h2 className="mb-1 text-lg font-bold text-white">Choose Your Aura</h2>
              <p className="mb-4 text-xs" style={{ color: theme.palette.muted }}>
                This colours your shareable snapshot card.
              </p>
              <ThemeSelector />
              <div className="mt-5 flex justify-between">
                <GlowButton variant="ghost" onClick={() => setStep(1)}>
                  ← Back
                </GlowButton>
                <GlowButton onClick={() => setStep(3)}>
                  Next: Generate →
                </GlowButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 3 – Generate */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassCard className="p-5 text-center" hover={false}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
                Step 3
              </p>
              <h2 className="mb-2 text-lg font-bold text-white">Ready to Capture</h2>

              {/* Summary */}
              <div
                className="my-5 rounded-2xl border px-4 py-4 text-left"
                style={{ borderColor: theme.palette.border, background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Era</span>
                  <span className="text-xs font-semibold text-white">
                    {timeRanges.find((r) => r.id === timeRange)?.label}
                  </span>
                </div>
                <div
                  className="mt-2.5 flex items-center justify-between border-t pt-2.5"
                  style={{ borderColor: theme.palette.border }}
                >
                  <span className="text-xs text-white/50">Aura</span>
                  <span className="text-xs font-semibold text-white capitalize">
                    {themeId.replace(/-/g, " ")}
                  </span>
                </div>
              </div>

              {isCreating ? (
                <InlineLoader text="Generating your aura…" />
              ) : (
                <GlowButton className="w-full py-4" onClick={createSnapshot}>
                  <span className="inline-flex items-center gap-2">
                    <Sparkles size={16} />
                    Generate & Share
                  </span>
                </GlowButton>
              )}

              <button
                onClick={() => setStep(2)}
                className="mt-3 text-xs"
                style={{ color: theme.palette.muted }}
              >
                ← Go back
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

