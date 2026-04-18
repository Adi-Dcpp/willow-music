import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import GlassCard from "../components/common/GlassCard";
import { EmptyState, ErrorState, InlineLoader } from "../components/common/StatePanel";
import { useTheme } from "../context/ThemeContext";

export default function SharePage() {
  const { id } = useParams();
  const { setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState(null);

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

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[420px] px-4 pb-24 pt-12">
        <InlineLoader text="Loading shared aura..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[420px] px-4 pb-24 pt-12">
        <ErrorState title="Share unavailable" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="mx-auto w-full max-w-[420px] px-4 pb-24 pt-12">
        <EmptyState title="No snapshot found" message="This share link may have expired." />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[420px] px-4 pb-24 pt-6">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-3xl font-semibold text-white"
      >
        Share your vibe 🌿
      </motion.h1>
      <p className="mt-2 text-center text-sm text-white/70">Snapshot #{snapshot.shareId || id}</p>

      <GlassCard className="mt-6 p-5" hover={false}>
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">Top Artists</p>
        <div className="mt-4 space-y-3">
          {(snapshot.topArtists || []).slice(0, 4).map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="flex items-center gap-3"
            >
              <img
                src={artist.imageUrl || artist.image || "https://placehold.co/110x110?text=A"}
                alt={artist.name}
                className="h-11 w-11 rounded-full object-cover"
              />
              <p className="font-medium text-white">{artist.name}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="mt-4 p-5" hover={false}>
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">Insight Pulse</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${drift}%` }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            className="h-full rounded-full bg-gradient-to-r from-white/60 to-white"
          />
        </div>
        <p className="mt-3 text-sm text-white/75">Taste Drift {drift}/100</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {computedGenres.length === 0 ? (
            <p className="text-xs text-white/60">No genre data available for this snapshot.</p>
          ) : null}
          {computedGenres.map((item, idx) => (
            <motion.span
              key={`${item.genre}-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white"
            >
              {item.genre} · {item.count}
            </motion.span>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
