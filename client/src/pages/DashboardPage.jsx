import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import AnimatedSection from "../components/common/AnimatedSection";
import EqualizerBars from "../components/common/EqualizerBars";
import GlassCard from "../components/common/GlassCard";
import InsightRing from "../components/common/InsightRing";
import GlowButton from "../components/common/GlowButton";
import { EmptyState, ErrorState } from "../components/common/StatePanel";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

function LoadingCard() {
  return <div className="h-28 rounded-2xl bg-white/10 shimmer" />;
}

const ranges = [
  { id: "short_term", label: "4W" },
  { id: "medium_term", label: "6M" },
  { id: "long_term", label: "ALL" },
];

export default function DashboardPage() {
  const { user, refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("medium_term");
  const [payload, setPayload] = useState({
    topTracks: [],
    topArtists: [],
    insights: { tasteDriftScore: 0, topGenres: [] },
  });

  const loadDashboard = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      if (!user) {
        await refreshSession();
      }

      const response = await api.get("/top", {
        params: {
          timeRange,
          limit: 12,
        },
      });

      setPayload(
        response.data?.data || {
          topTracks: [],
          topArtists: [],
          insights: { tasteDriftScore: 0, topGenres: [] },
        }
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load your music aura right now.");
    } finally {
      setLoading(false);
    }
  }, [refreshSession, timeRange, user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const topTracks = payload?.topTracks || [];
  const topArtists = payload?.topArtists || [];
  const tasteDriftScore = payload?.insights?.tasteDriftScore ?? 0;
  const topGenres = payload?.insights?.topGenres || [];

  return (
    <div className="mx-auto w-full max-w-[420px] px-4 pb-28 pt-6">
      <AnimatedSection>
        <GlassCard className="p-4">
          <div className="flex items-center gap-4">
            <img
              src={user?.profileImage || "https://placehold.co/160x160?text=Willow"}
              alt={user?.displayName || "Willow user"}
              className="h-16 w-16 rounded-full border-2 border-white/30 object-cover"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Profile</p>
              <h2 className="text-xl font-semibold text-white">{user?.displayName || "Your vibe"}</h2>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {ranges.map((option) => (
              <button
                key={option.id}
                onClick={() => setTimeRange(option.id)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  option.id === timeRange ? "bg-white/20 text-white" : "bg-white/5 text-white/70"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </GlassCard>
      </AnimatedSection>

      {error ? (
        <AnimatedSection delay={0.05} className="mt-5">
          <ErrorState title="Dashboard unavailable" message={error} onRetry={loadDashboard} />
        </AnimatedSection>
      ) : null}

      <AnimatedSection delay={0.1} className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">Top Tracks</h3>
          <EqualizerBars />
        </div>
        {loading ? (
          <div className="space-y-3">
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : topTracks.length === 0 ? (
          <EmptyState title="No top tracks yet" message="Play more music on Spotify and come back." />
        ) : (
          <div className="flex snap-x gap-3 overflow-x-auto pb-2">
            {topTracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08, ease: "easeInOut" }}
                className="min-w-[180px] snap-start"
              >
                <GlassCard className="p-3">
                  <img
                    src={track.albumImageUrl || "https://placehold.co/300x300?text=Track"}
                    alt={track.name}
                    className="h-28 w-full rounded-2xl object-cover"
                  />
                  <p className="mt-3 text-sm font-semibold text-white">{track.name}</p>
                  <p className="text-xs text-white/60">{(track.artistNames || []).join(", ")}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatedSection>

      <AnimatedSection delay={0.2} className="mt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/75">Top Artists</h3>
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <LoadingCard key={idx} />
            ))}
          </div>
        ) : topArtists.length === 0 ? (
          <EmptyState title="No top artists yet" message="Your favorite artists will appear here soon." />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {topArtists.map((artist, index) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, ease: "easeInOut" }}
                whileHover={{ y: -4, scale: 1.04 }}
                className="rounded-3xl border border-white/20 bg-white/10 p-2 backdrop-blur-xl"
              >
                <img
                  src={artist.imageUrl || artist.image || "https://placehold.co/160x160?text=Artist"}
                  alt={artist.name}
                  className="mx-auto h-16 w-16 rounded-full object-cover"
                />
                <p className="mt-2 truncate text-center text-xs text-white/85">{artist.name}</p>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatedSection>

      <AnimatedSection delay={0.3} className="mt-6">
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">Insights</h3>
          <div className="mt-3">
            <InsightRing value={tasteDriftScore} />
            <p className="mt-3 text-center text-sm text-white/70">Taste Drift Score</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {topGenres.length === 0 && !loading ? (
              <p className="text-xs text-white/60">No genre insight available yet.</p>
            ) : null}
            {topGenres.map((item, index) => (
              <motion.span
                key={`${item.genre}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                whileHover={{ scale: 1.06 }}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs text-white"
              >
                {item.genre} · {item.count}
              </motion.span>
            ))}
          </div>

          <div className="mt-4">
            <GlowButton className="w-full" onClick={loadDashboard}>
              Refresh Aura
            </GlowButton>
          </div>
        </GlassCard>
      </AnimatedSection>
    </div>
  );
}
