import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import GlassCard from "../components/common/GlassCard";
import InsightRing from "../components/common/InsightRing";
import { EmptyState, ErrorState, InlineLoader } from "../components/common/StatePanel";
import { useTheme } from "../context/ThemeContext";

export default function SharePage() {
  const { id } = useParams();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedMapRaw = window.localStorage.getItem("willow-snapshot-themes");
    const savedMap = savedMapRaw ? JSON.parse(savedMapRaw) : {};
    const themeId = savedMap[id];
    if (themeId) setTheme(themeId);
  }, [id, setTheme]);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        setError("");
        setLoading(true);
        const response = await api.get(`/share/${id}`);
        setSnapshot(response.data?.data || null);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load shared vibe.");
      } finally {
        setLoading(false);
      }
    };
    fetchSnapshot();
  }, [id]);

  const computedGenres = useMemo(() => {
    const fromInsights = snapshot?.insights?.topGenres || [];
    if (fromInsights.length) return fromInsights;
    const map = {};
    (snapshot?.topArtists || []).forEach((artist) => {
      (artist.genres || []).forEach((genre) => {
        map[genre] = (map[genre] || 0) + 1;
      });
    });
    return Object.entries(map)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [snapshot]);

  const drift = snapshot?.insights?.tasteDriftScore ?? 0;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "My Willow Music Identity", url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 pt-16">
        <InlineLoader text="Loading shared aura…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 pt-16">
        <ErrorState title="Share unavailable" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 pt-16">
        <EmptyState title="No snapshot found" message="This share link may have expired." />
      </div>
    );
  }

  const topArtists = snapshot.topArtists || [];
  const topTracks = snapshot.topTracks || [];

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-16 pt-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <p
          className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.palette.accent }}
        >
          Willow · Music Identity
        </p>
        <h1 className="text-3xl font-bold text-white">Share Your Vibe 🌿</h1>
        <p className="mt-1.5 text-sm" style={{ color: theme.palette.muted }}>
          Snapshot #{(snapshot.shareId || id).slice(0, 8)}
        </p>
      </motion.div>

      {/* Top Artists card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <GlassCard className="overflow-hidden p-0 mb-4" hover={false}>
          <div className="h-1.5 w-full" style={{ background: theme.palette.button }} />
          <div className="p-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
              Top Artists
            </p>
            <div className="space-y-3">
              {topArtists.slice(0, 5).map((artist, index) => (
                <motion.div
                  key={artist.id}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + index * 0.07 }}
                  className="flex items-center gap-4"
                >
                  <span
                    className="rank-badge w-5 shrink-0 text-center text-[11px] font-bold"
                    style={{ color: index === 0 ? theme.palette.accent : "rgba(255,255,255,0.35)" }}
                  >
                    {index + 1}
                  </span>
                  <img
                    src={artist.imageUrl || artist.image || "https://placehold.co/88x88?text=A"}
                    alt={artist.name}
                    className="h-11 w-11 shrink-0 rounded-full border object-cover"
                    style={{ borderColor: index === 0 ? theme.palette.accent : theme.palette.border }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{artist.name}</p>
                    {artist.genres?.length > 0 && (
                      <p className="truncate text-xs" style={{ color: theme.palette.muted }}>
                        {artist.genres.slice(0, 2).join(" · ")}
                      </p>
                    )}
                  </div>
                  {index === 0 && (
                    <span
                      className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: theme.palette.button }}
                    >
                      #1
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Top Tracks preview */}
      {topTracks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4"
        >
          <GlassCard className="p-5" hover={false}>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
              Top Tracks
            </p>
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {topTracks.slice(0, 6).map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="shrink-0"
                >
                  <div className="relative">
                    <img
                      src={track.albumImageUrl || "https://placehold.co/88x88?text=T"}
                      alt={track.name}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <span
                      className="rank-badge absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ background: index === 0 ? theme.palette.button : "rgba(0,0,0,0.65)" }}
                    >
                      {index + 1}
                    </span>
                  </div>
                  <p className="mt-1.5 w-16 truncate text-center text-[10px] text-white/80">
                    {track.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="mb-6"
      >
        <GlassCard className="p-5" hover={false}>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
            Insight Pulse
          </p>
          <div className="flex items-center gap-5">
            <InsightRing value={drift} />
            <div>
              <p className="text-sm font-semibold text-white">Taste Drift</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: theme.palette.accent }}>
                {drift}<span className="text-sm font-normal text-white/50">/100</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.palette.muted }}>
                {drift >= 70
                  ? "Always discovering new sounds."
                  : drift >= 40
                  ? "A healthy mix of new & familiar."
                  : "A loyal listener with a signature taste."}
              </p>
            </div>
          </div>

          {computedGenres.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {computedGenres.map((item, idx) => (
                <motion.span
                  key={`${item.genre}-${idx}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium text-white"
                  style={{
                    borderColor: theme.palette.border,
                    background: theme.palette.accentSoft,
                  }}
                >
                  {item.genre} · {item.count}
                </motion.span>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Share CTA */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleShare}
        className="w-full rounded-full py-4 text-sm font-semibold text-white"
        style={{
          background: theme.palette.button,
          boxShadow: `0 12px 32px -8px ${theme.palette.accentSoft}`,
        }}
      >
        <span className="inline-flex items-center gap-2">
          <Share2 size={15} />
          {copied ? "Link Copied!" : "Share This Vibe"}
        </span>
      </motion.button>

      <p className="mt-4 text-center text-xs" style={{ color: theme.palette.muted }}>
        Made with Willow · Powered by Spotify
      </p>
    </div>
  );
}

