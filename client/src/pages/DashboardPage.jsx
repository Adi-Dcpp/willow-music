import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import AnimatedSection from "../components/common/AnimatedSection";
import EqualizerBars from "../components/common/EqualizerBars";
import GlassCard from "../components/common/GlassCard";
import InsightRing from "../components/common/InsightRing";
import GlowButton from "../components/common/GlowButton";
import { EmptyState, ErrorState } from "../components/common/StatePanel";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const VIBE_MAP = [
  { match: ["indie", "alternative", "dream pop", "shoegaze"], label: "Indie Dreamer" },
  { match: ["hip hop", "rap", "trap", "drill", "boom bap"], label: "Street Poet" },
  { match: ["r&b", "soul", "neo soul", "funk"], label: "Soul Tender" },
  { match: ["electronic", "edm", "techno", "house", "trance", "dance"], label: "Eternal Dancer" },
  { match: ["pop", "synth-pop", "electropop"], label: "Chart Chameleon" },
  { match: ["jazz", "blues", "swing"], label: "Jazz Wanderer" },
  { match: ["metal", "heavy metal", "death metal", "post-metal"], label: "Dark Edge" },
  { match: ["folk", "acoustic", "singer-songwriter", "country"], label: "Wandering Folk" },
  { match: ["lo-fi", "lo fi", "chillhop", "ambient", "downtempo"], label: "Lo-Fi Soul" },
  { match: ["classical", "orchestral", "opera", "chamber"], label: "Classical Phantom" },
];

function deriveVibe(topGenres = [], metrics = {}) {
  const genres = topGenres
    .map((g) => (typeof g === "string" ? g : g.genre))
    .filter(Boolean)
    .map((genre) => genre.toLowerCase());

  const joined = genres.join(" ");
  const uniqueGenres = new Set(genres).size;
  const genreCount = genres.length;
  const dominantShare = metrics.dominantShare ?? (genreCount ? 1 / Math.max(1, uniqueGenres) : 0);
  const artistSpread = metrics.artistSpread ?? 0;
  const depthScore = metrics.depthScore ?? 0;

  for (const entry of VIBE_MAP) {
    if (entry.match.some((k) => joined.includes(k))) return entry.label;
  }

  if (uniqueGenres >= 5 && artistSpread >= 0.7 && dominantShare < 0.35) return "Sonic Wanderer";
  if (dominantShare >= 0.45 && uniqueGenres <= 2) return "Deep Cut Devotee";
  if (artistSpread >= 0.6) return "Genre Drifter";
  if (depthScore >= 0.7) return "Layered Listener";

  return topGenres.length ? "Balanced Listener" : "Sonic Wanderer";
}

function TrackSkeleton() {
  return (
    <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white/5">
      <div className="h-40 rounded-2xl bg-white/8 shimmer" />
      <div className="p-3">
        <div className="h-3.5 w-3/4 rounded-full bg-white/8 shimmer" />
        <div className="mt-1.5 h-3 w-1/2 rounded-full bg-white/8 shimmer" />
      </div>
    </div>
  );
}

function ArtistSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/10 bg-white/5 p-3">
      <div className="h-20 w-20 rounded-full bg-white/8 shimmer" />
      <div className="h-3 w-14 rounded-full bg-white/8 shimmer" />
    </div>
  );
}

function AIReviewSkeleton() {
  return (
    <div className="space-y-3 px-1">
      {[100, 85, 95, 70].map((w, i) => (
        <div key={i} className={`h-4 rounded-full bg-white/8 shimmer`} style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

const ranges = [
  { id: "short_term", label: "4 Weeks", short: "4W" },
  { id: "medium_term", label: "6 Months", short: "6M" },
  { id: "long_term", label: "All Time", short: "ALL" },
];

const EMPTY_DASHBOARD_PAYLOAD = {
  topTracks: [],
  topArtists: [],
  summary: {
    topGenres: [],
    topArtist: "",
    vibe: "",
    depthScore: 0,
  },
  insights: {
    tasteDriftScore: 0,
    tasteDriftMessage: "",
    topGenres: [],
  },
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

const getTasteDriftMessage = (score) => {
  if (score >= 85) return "Boundary breaker: your rotation is in constant discovery mode.";
  if (score >= 65) return "Curious explorer: you regularly expand beyond your usual lane.";
  if (score >= 45) return "Balanced explorer: you mix comfort tracks with fresh finds.";
  if (score >= 25) return "Steady core: your taste is consistent with occasional detours.";
  return "Signature locked: you know your sound and stay true to it.";
};

const getSpotifyTrackUrl = (track) => {
  if (track?.spotifyUrl) return track.spotifyUrl;
  if (track?.external_urls?.spotify) return track.external_urls.spotify;
  if (track?.id) return `https://open.spotify.com/track/${track.id}`;
  return null;
};

const normalizeDashboardPayload = (apiPayload) => {
  const source = apiPayload?.data || apiPayload || {};
  const summary = source.summary || {};

  const topTracks = Array.isArray(source.topTracks)
    ? source.topTracks.map((track) => {
        const artistNames = Array.isArray(track?.artistNames)
          ? track.artistNames
          : typeof track?.artist === "string"
          ? track.artist.split(",").map((s) => s.trim()).filter(Boolean)
          : [];

        return {
          ...track,
          artistNames,
          albumImageUrl: track?.albumImageUrl || track?.image || null,
        };
      })
    : [];

  const topArtists = Array.isArray(source.topArtists)
    ? source.topArtists.map((artist) => ({
        ...artist,
        imageUrl: artist?.imageUrl || artist?.image || null,
      }))
    : [];

  const summaryTopGenres = Array.isArray(summary.topGenres) ? summary.topGenres : [];
  const insightTopGenres = Array.isArray(source.insights?.topGenres) ? source.insights.topGenres : [];

  const normalizedGenres = insightTopGenres.length
    ? insightTopGenres
    : summaryTopGenres.map((genre) => ({ genre, count: 1 }));

  const legacyScore = toNumber(source.insights?.tasteDriftScore, NaN);
  const summaryDepth = toNumber(summary.depthScore, 0);
  const depthAsPercent = summaryDepth <= 1 ? summaryDepth * 100 : summaryDepth;
  const tasteDriftScore = Number.isFinite(legacyScore)
    ? clampScore(legacyScore)
    : clampScore(depthAsPercent);
  const tasteDriftMessage = source.insights?.tasteDriftMessage || getTasteDriftMessage(tasteDriftScore);

  return {
    ...EMPTY_DASHBOARD_PAYLOAD,
    ...source,
    topTracks,
    topArtists,
    summary: {
      ...EMPTY_DASHBOARD_PAYLOAD.summary,
      ...summary,
      topGenres: summaryTopGenres,
    },
    insights: {
      ...EMPTY_DASHBOARD_PAYLOAD.insights,
      ...(source.insights || {}),
      tasteDriftScore,
      tasteDriftMessage,
      topGenres: normalizedGenres,
    },
  };
};

export default function DashboardPage() {
  const { user, refreshSession } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("medium_term");
  const [payload, setPayload] = useState(EMPTY_DASHBOARD_PAYLOAD);
  const [aiReview, setAIReview] = useState("");
  const [aiLoading, setAILoading] = useState(false);
  const aiSummaryRef = useRef(null);

  const fetchAIReview = useCallback(async (summary) => {
    try {
      setAILoading(true);
      const response = await api.post("/ai/review", { summary });
      setAIReview(response.data?.review || "");
    } catch {
      // silently fail — the card just won't show
    } finally {
      setAILoading(false);
    }
  }, []);

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

      const data = normalizeDashboardPayload(response.data);

      setPayload(data);

      // Fetch AI review based on this data (once per session per timeRange)
      const rawGenres = data.insights?.topGenres || [];
      const topGenres = data.summary?.topGenres?.length
        ? data.summary.topGenres
        : rawGenres.map((g) => (typeof g === "string" ? g : g.genre)).filter(Boolean);
      const topArtist = data.summary?.topArtist || data.topArtists?.[0]?.name || "";
      const tasteDriftScore = data.insights?.tasteDriftScore ?? 0;
      const vibeLabel =
        data.summary?.vibe ||
        deriveVibe(rawGenres, {
          dominantShare: 1 / Math.max(1, rawGenres.length || 1),
          artistSpread: data.topArtists?.length ? new Set(data.topArtists.map((artist) => artist.id)).size / data.topArtists.length : 0,
          depthScore: data.summary?.depthScore || 0,
        });
      const summary = { topGenres, topArtist, vibe: vibeLabel, depthScore: tasteDriftScore };
      const summaryKey = JSON.stringify(summary);

      if (aiSummaryRef.current !== summaryKey) {
        aiSummaryRef.current = summaryKey;
        setAIReview("");
        fetchAIReview(summary);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load your music aura right now.");
    } finally {
      setLoading(false);
    }
  }, [refreshSession, timeRange, user, fetchAIReview]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const topTracks = payload?.topTracks || [];
  const topArtists = payload?.topArtists || [];
  const tasteDriftScore = payload?.insights?.tasteDriftScore ?? 0;
  const tasteDriftMessage = payload?.insights?.tasteDriftMessage || getTasteDriftMessage(tasteDriftScore);
  const topGenres = payload?.insights?.topGenres || [];
  const activeRange = ranges.find((r) => r.id === timeRange);
  const vibe = payload?.summary?.vibe || deriveVibe(topGenres, {
    dominantShare: topGenres.length ? 1 / Math.max(1, topGenres.length) : 0,
    artistSpread: topArtists.length ? new Set(topArtists.map((artist) => artist.id)).size / topArtists.length : 0,
    depthScore: payload?.summary?.depthScore || 0,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-32 pt-8 lg:px-8">

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
            <p className="text-xs" style={{ color: theme.palette.muted }}>
              Showing {Math.min(topTracks.length, 20)} tracks from your era
            </p>
          </div>
          <EqualizerBars />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => <TrackSkeleton key={i} />)}
          </div>
        ) : topTracks.length === 0 ? (
          <EmptyState title="No top tracks yet" message="Play more music on Spotify and come back." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {topTracks.slice(0, 20).map((track, index) => (
              <motion.button
                key={track.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => {
                  const spotifyUrl = getSpotifyTrackUrl(track);
                  if (!spotifyUrl) return;
                  window.open(spotifyUrl, "_blank", "noopener,noreferrer");
                }}
                className="text-left"
              >
                <GlassCard className="h-full overflow-hidden p-0" hover>
                  <div className="relative">
                    <img
                      src={track.albumImageUrl || "https://placehold.co/300x300?text=Track"}
                      alt={track.name}
                      className="h-36 w-full object-cover sm:h-40"
                    />
                    <span
                      className="rank-badge absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{
                        background: index === 0 ? theme.palette.button : "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      {index + 1}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/70 to-transparent" />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs font-semibold text-white">{track.name}</p>
                    <p className="mt-0.5 truncate text-[10px]" style={{ color: theme.palette.muted }}>
                      {(track.artistNames || []).join(", ")}
                    </p>
                  </div>
                </GlassCard>
              </motion.button>
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
          <p className="text-xs" style={{ color: theme.palette.muted }}>
            Showing {Math.min(topArtists.length, 10)} artists shaping your sound
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => <ArtistSkeleton key={i} />)}
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
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {topArtists.slice(1, 10).map((artist, index) => (
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
                      className="h-20 w-20 rounded-full border object-cover sm:h-16 sm:w-16"
                      style={{ borderColor: theme.palette.border }}
                    />
                    <span
                      className="rank-badge absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ background: "rgba(0,0,0,0.7)", border: `1px solid ${theme.palette.border}` }}
                    >
                      {index + 2}
                    </span>
                  </div>
                  <p className="w-full truncate text-center text-[10px] font-medium text-white/80 sm:text-[11px]">
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
                {tasteDriftMessage}
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
        </GlassCard>
      </AnimatedSection>

      {/* ── Vibe Card ── */}
      <AnimatedSection delay={0.4} className="mt-8">
        <GlassCard className="overflow-hidden p-0" hover={false}>
          {/* Top gradient bar */}
          <div className="h-1.5 w-full" style={{ background: theme.palette.button }} />

          <div className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
              Music Identity
            </p>
            <h3 className="text-lg font-bold text-white">Your Vibe</h3>

            {/* Vibe label */}
            <motion.div
              className="mt-5 flex flex-col items-center text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {loading ? (
                <div className="h-12 w-48 rounded-2xl bg-white/8 shimmer" />
              ) : (
                <motion.h2
                  className="text-gradient text-4xl font-bold leading-tight tracking-tight"
                  style={{ backgroundImage: theme.palette.button }}
                  animate={{ opacity: [0.85, 1, 0.85] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {vibe}
                </motion.h2>
              )}

              {/* Depth score bar */}
              <div className="mt-6 w-full">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                    Depth Score
                  </span>
                  {!loading && (
                    <span className="text-xs font-bold" style={{ color: theme.palette.accent }}>
                      {tasteDriftScore}<span className="text-white/40 font-normal">/100</span>
                    </span>
                  )}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  {loading ? (
                    <div className="h-full rounded-full shimmer bg-white/20" />
                  ) : (
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: theme.palette.button }}
                      initial={{ width: "0%" }}
                      whileInView={{ width: `${tasteDriftScore}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    />
                  )}
                </div>
              </div>

              {/* Genre pills */}
              {(loading || topGenres.length > 0) && (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-7 w-20 rounded-full bg-white/8 shimmer" />
                    ))
                  ) : (
                    topGenres.slice(0, 5).map((item, index) => (
                      <motion.span
                        key={`vibe-genre-${index}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.06 }}
                        whileHover={{ scale: 1.06 }}
                        className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium text-white"
                        style={{
                          borderColor: theme.palette.border,
                          background: theme.palette.accentSoft,
                        }}
                      >
                        {typeof item === "string" ? item : item.genre}
                      </motion.span>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </GlassCard>
      </AnimatedSection>

      {/* ── AI Personality Card ── */}
      <AnimatedSection delay={0.5} className="mt-8">
        <GlassCard className="overflow-hidden p-0" hover={false}>
          {/* Glowing top bar */}
          <motion.div
            className="h-1.5 w-full"
            style={{ background: theme.palette.button }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
                  AI Insight
                </p>
                <h3 className="text-lg font-bold text-white">Your Personality</h3>
              </div>
              <motion.div
                animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.1, 0.95, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles size={20} style={{ color: theme.palette.accent }} />
              </motion.div>
            </div>

            {/* AI Review Text */}
            <div className="relative">
              {/* Quote mark */}
              <div
                className="pointer-events-none absolute -left-1 -top-2 text-6xl font-serif leading-none text-white/10 select-none"
                aria-hidden
              >
                &ldquo;
              </div>

              {aiLoading || (loading && !aiReview) ? (
                <div className="pt-4">
                  <AIReviewSkeleton />
                </div>
              ) : aiReview ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="pt-4 text-center"
                >
                  <motion.p
                    className="text-[15px] font-medium leading-relaxed tracking-wide"
                    style={{
                      color: "rgba(255,255,255,0.88)",
                      textShadow: `0 0 32px ${theme.palette.accentSoft}`,
                    }}
                  >
                    {aiReview}
                  </motion.p>
                  {/* Glow accent line below */}
                  <motion.div
                    className="mx-auto mt-5 h-px w-16 rounded-full"
                    style={{ background: theme.palette.button }}
                    animate={{ width: ["40px", "64px", "40px"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
              ) : !loading ? (
                <div className="pt-4 text-center">
                  <p className="text-sm" style={{ color: theme.palette.muted }}>
                    No personality insight yet — refresh to generate yours.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </GlassCard>
      </AnimatedSection>

      {/* ── Refresh ── */}
      <AnimatedSection delay={0.55} className="mt-6 mb-2">
        <GlowButton className="w-full" onClick={loadDashboard} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh Aura"}
        </GlowButton>
      </AnimatedSection>
    </div>
  );
}

