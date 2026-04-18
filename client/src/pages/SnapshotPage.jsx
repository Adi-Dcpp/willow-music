import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import GlassCard from "../components/common/GlassCard";
import GlowButton from "../components/common/GlowButton";
import { ErrorState, InlineLoader } from "../components/common/StatePanel";
import ThemeSelector from "../components/snapshot/ThemeSelector";
import { useTheme } from "../context/ThemeContext";

const timeRanges = [
  { id: "short_term", label: "Last 4 Weeks" },
  { id: "medium_term", label: "Last 6 Months" },
  { id: "long_term", label: "All Time" },
];

export default function SnapshotPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [timeRange, setTimeRange] = useState("medium_term");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [createdShareId, setCreatedShareId] = useState("");
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

      setCreatedShareId(shareId);
      setIsCreating(false);
      setStep(3);
      navigate(`/share/${shareId}`);
    } catch (err) {
      setIsCreating(false);
      setError(err?.response?.data?.message || "Could not create snapshot right now.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[420px] px-4 pb-24 pt-6">
      <h1 className="text-center text-2xl font-semibold text-white">Create Your Snapshot</h1>
      <p className="mt-2 text-center text-sm" style={{ color: theme.palette.muted }}>
        Pick your window, lock your vibe, and generate a shareable aura.
      </p>

      {error ? (
        <div className="mt-4">
          <ErrorState title="Snapshot failed" message={error} onRetry={createSnapshot} />
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <GlassCard className="p-4" hover={false}>
          <p className="text-sm font-semibold text-white">Step 1 • Time Range</p>
          <div className="mt-3 space-y-2">
            {timeRanges.map((item) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTimeRange(item.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm text-white transition ${
                  timeRange === item.id ? "bg-white/20" : "bg-white/5"
                }`}
              >
                {item.label}
              </motion.button>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <GlowButton onClick={() => setStep(2)}>
              Continue <ChevronRight className="ml-1 inline" size={16} />
            </GlowButton>
          </div>
        </GlassCard>

        {step >= 2 && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-4" hover={false}>
              <p className="text-sm font-semibold text-white">Step 2 • Theme</p>
              <p className="mt-1 text-xs text-white/65">Live preview updates instantly</p>
              <div className="mt-3">
                <ThemeSelector />
              </div>
            </GlassCard>
          </motion.div>
        )}

        {step >= 2 && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-4" hover={false}>
              <p className="text-sm font-semibold text-white">Step 3 • Generate</p>
              {createdShareId ? (
                <p className="mt-2 text-xs text-white/70">Snapshot ready: {createdShareId}</p>
              ) : null}
              <GlowButton className="mt-3 w-full" onClick={createSnapshot} disabled={isCreating}>
                {isCreating ? (
                  <InlineLoader text="Creating your vibe..." />
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Sparkles size={16} /> Create Snapshot
                  </span>
                )}
              </GlowButton>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
