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
import { useTheme } from "../context/ThemeContext";

function TrackSkeleton() {
  return (
    <div className="min-w-[160px] shrink-0 snap-start">
      <div className="h-40 rounded-2xl bg-white/8 shimmer" />
      <div className="mt-2 h-3.5 w-3/4 rounded-full bg-white/8 shimmer" />
      <div className="mt-1.5 h-3 w-1/2 rounded-full bg-white/8 shimmer" />
    </div>
  );
}

function ArtistSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-20 w-20 rounded-full bg-white/8 shimmer" />
      <div className="h-3 w-14 rounded-full bg-white/8 shimmer" />
    </div>
  );
}

const ranges = [
  { id: "short_term", label: "4 Weeks", short: "4W" },
  { id: "medium_term", label: "6 Months", short: "6M" },
  { id: "long_term", label: "All Time", short: "ALL" },
];

export default function DashboardPage() {
  const { user, refreshSession } = useAuth();
  const { theme } = useTheme();
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
  const activeRange = ranges.find((r) => r.id === timeRange);

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32 pt-8">

      {/* ── Profile Hero ── */}
      <AnimatedSection>
        <GlassCard className="overflow-hidden p-0" hover={false}>
          {/* Accent top bar */}
          <div
            className="h-1.5 w-full"
            style={{ background: theme.palette.button }}
          />
          <div className="flex items-center gap-4 p-5">
            {/* Avatar with glow ring */}
            <div className="relative shrink-0">
              <motion.div
                className="absolute inset-0 rounded-full blur-lg"
                style={{ backgroundColor: theme.palette.accentSoft }}
                animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.1, 0.95] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <img
                src={user?.profileImage || "https://placehold.co/160x160?text=W"}
                alt={user?.displayName || "Willow user"}
                className="relative h-16 w-16 rounded-full border-2 object-cover"
                style={{ borderColor: theme.palette.accent }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
                Your Aura
              </p>
              <h2 className="mt-0.5 truncate text-xl font-bold text-white">
                {user?.displayName || "Your vibe"}
              </h2>
              <p className="mt-0.5 text-xs" style={{ color: theme.palette.muted }}>
                Listening era · {activeRange?.label}
              </p>
            </div>
          </div>

          {/* Time range switcher */}
          <div
            className="flex gap-1.5 border-t px-5 py-3"
            style={{ borderColor: theme.palette.border }}
          >
            {ranges.map((option) => {
              const active = option.id === timeRange;
              return (
                <motion.button
                  key={option.id}
                  onClick={() => setTimeRange(option.id)}
                  whileTap={{ scale: 0.94 }}
                  className="flex-1 rounded-full py-2 text-xs font-semibold tracking-wide transition-all"
                  style={
                    active
                      ? {
                          background: theme.palette.button,
                          color: "#fff",
                          boxShadow: `0 4px 14px -4px ${theme.palette.accentSoft}`,
                        }
                      : {
                          background: "rgba(255,255,255,0.05)",
                          color: "rgba(255,255,255,0.55)",
                        }
                  }
                >
                  {option.short}
                </motion.button>
              );
            })}
          </div>
        </GlassCard>
      </AnimatedSection>

      {error ? (
        <AnimatedSection delay={0.05} className="mt-5">
          <ErrorState title="Dashboard unavailable" message={error} onRetry={loadDashboard} />
        </AnimatedSection>
      ) : null}

      {/* ── Top Tracks ── */}
      <AnimatedSection delay={0.1} className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
              Your Sound
            </p>
            <h3 className="text-lg font-bold text-white">Top Tracks</h3>
          </div>
          <EqualizerBars />
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-hidden pb-1">
            {Array.from({ length: 4 }).map((_, i) => <TrackSkeleton key={i} />)}
          </div>
        ) : topTracks.length === 0 ? (
          <EmptyState title="No top tracks yet" message="Play more music on Spotify and come back." />
        ) : (
          <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
            {topTracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-[160px] max-w-[160px] shrink-0 snap-start"
              >
                <GlassCard className="overflow-hidden p-0" hover>
                  <div className="relative">
                    <img
                      src={track.albumImageUrl || "https://placehold.co/300x300?text=Track"}
                      alt={track.name}
                      className="h-40 w-full object-cover"
                    />
                    {/* Rank badge */}
                    <span
                      className="rank-badge absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{
                        background: index === 0 ? theme.palette.button : "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      {index + 1}
                    </span>
                    {/* Gradient overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs font-semibold text-white">{track.name}</p>
                    <p className="mt-0.5 truncate text-[10px]" style={{ color: theme.palette.muted }}>
                      {(track.artistNames || []).join(", ")}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatedSection>

      {/* ── Top Artists ── */}
      <AnimatedSection delay={0.2} className="mt-8">
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
            Your Influences
          </p>
          <h3 className="text-lg font-bold text-white">Top Artists</h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <ArtistSkeleton key={i} />)}
          </div>
        ) : topArtists.length === 0 ? (
          <EmptyState title="No top artists yet" message="Your favorite artists will appear here soon." />
        ) : (
          <>
            {/* Featured #1 Artist */}
            {topArtists[0] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ease: [0.22, 1, 0.36, 1] }}
                className="mb-4"
              >
                <GlassCard className="overflow-hidden p-0" hover>
                  <div className="relative h-36">
                    <img
                      src={topArtists[0].imageUrl || topArtists[0].image || "https://placehold.co/640x240?text=Artist"}
                      alt={topArtists[0].name}
                      className="h-full w-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span
                        className="mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ background: theme.palette.button }}
                      >
                        #1 Artist
                      </span>
                      <h4 className="text-xl font-bold text-white">{topArtists[0].name}</h4>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Remaining artists grid */}
            <div className="grid grid-cols-4 gap-3">
              {topArtists.slice(1).map((artist, index) => (
                <motion.div
                  key={artist.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index + 1) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4, scale: 1.06 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="relative">
                    <div
                      className="absolute inset-0 rounded-full blur-md opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ backgroundColor: theme.palette.accentSoft }}
                    />
                    <img
                      src={artist.imageUrl || artist.image || "https://placehold.co/160x160?text=A"}
                      alt={artist.name}
                      className="h-16 w-16 rounded-full object-cover border"
                      style={{ borderColor: theme.palette.border }}
                    />
                    <span
                      className="rank-badge absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ background: "rgba(0,0,0,0.7)", border: `1px solid ${theme.palette.border}` }}
                    >
                      {index + 2}
                    </span>
                  </div>
                  <p className="w-full truncate text-center text-[10px] font-medium text-white/80">
                    {artist.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatedSection>

      {/* ── Insights ── */}
      <AnimatedSection delay={0.3} className="mt-8">
        <GlassCard className="p-5" hover={false}>
          <div className="mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
              Music DNA
            </p>
            <h3 className="text-lg font-bold text-white">Insights</h3>
          </div>

          {/* Taste Drift Ring */}
          <div className="mt-4 flex items-center gap-6">
            <InsightRing value={tasteDriftScore} />
            <div>
              <p className="text-sm font-semibold text-white">Taste Drift Score</p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.palette.muted }}>
                {tasteDriftScore >= 70
                  ? "Your taste is evolving fast — you're always discovering."
                  : tasteDriftScore >= 40
                  ? "You balance new finds with beloved classics."
                  : "You've found your signature sound and own it."}
              </p>
            </div>
          </div>

          {/* Genre Pills */}
          {(loading || topGenres.length > 0) && (
            <div
              className="mt-5 border-t pt-4"
              style={{ borderColor: theme.palette.border }}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
                Genre Mix
              </p>
              {loading ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-7 w-20 rounded-full bg-white/8 shimmer" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topGenres.map((item, index) => (
                    <motion.span
                      key={`${item.genre}-${index}`}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + index * 0.05 }}
                      whileHover={{ scale: 1.06 }}
                      className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium text-white"
                      style={{
                        borderColor: theme.palette.border,
                        background: `${theme.palette.accentSoft}`,
                      }}
                    >
                      {item.genre}
                      <span className="rounded-full px-1 text-[10px] font-bold text-white/60">
                        ×{item.count}
                      </span>
                    </motion.span>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && topGenres.length === 0 && (
            <p className="mt-4 text-xs" style={{ color: theme.palette.muted }}>
              No genre data yet — keep listening!
            </p>
          )}

          <div className="mt-5">
            <GlowButton className="w-full" onClick={loadDashboard} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh Aura"}
            </GlowButton>
          </div>
        </GlassCard>
      </AnimatedSection>
    </div>
  );
}

