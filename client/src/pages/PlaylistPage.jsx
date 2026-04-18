import { motion } from "framer-motion";
import { ExternalLink, ListMusic, Loader2 } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import GlassCard from "../components/common/GlassCard";
import GlowButton from "../components/common/GlowButton";
import { ErrorState } from "../components/common/StatePanel";
import { useTheme } from "../context/ThemeContext";

const defaultPayload = {
  timeRange: "medium_term",
  name: "Willow Playlist 🌿",
  trackCount: 20,
  isPublic: true,
};

export default function PlaylistPage() {
  const { theme } = useTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");

  const createPlaylist = async () => {
    try {
      setError("");
      setIsCreating(true);
      const response = await api.post("/playlist/from-top", defaultPayload);
      setPlaylistUrl(response.data?.data?.playlistUrl || "");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create playlist right now.");
    } finally {
      setIsCreating(false);
    }
  };

  const openPlaylist = () => {
    window.open(playlistUrl || "https://open.spotify.com", "_blank");
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 pb-28 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <p
            className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: theme.palette.accent }}
          >
            Playlist
          </p>
          <h1 className="text-3xl font-bold text-white">Your Sound, Curated</h1>
          <p className="mt-2 text-sm" style={{ color: theme.palette.muted }}>
            Generate a Spotify playlist from your top tracks.
          </p>
        </div>

        <GlassCard className="p-6" hover={false}>
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <motion.div
              animate={
                playlistUrl
                  ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }
                  : isCreating
                  ? { rotate: 360 }
                  : { scale: [1, 1.06, 1] }
              }
              transition={
                isCreating
                  ? { duration: 1, repeat: Infinity, ease: "linear" }
                  : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
              }
              className="flex h-20 w-20 items-center justify-center rounded-2xl border"
              style={{
                borderColor: theme.palette.border,
                background: `${theme.palette.accentSoft}`,
                boxShadow: `0 0 40px ${theme.palette.accentSoft}`,
              }}
            >
              {isCreating ? (
                <Loader2 size={36} style={{ color: theme.palette.accent }} />
              ) : (
                <ListMusic size={36} style={{ color: theme.palette.accent }} />
              )}
            </motion.div>
          </div>

          {/* Playlist details card */}
          {!playlistUrl && (
            <div
              className="mb-6 rounded-2xl border px-4 py-4 text-sm"
              style={{ borderColor: theme.palette.border, background: "rgba(255,255,255,0.03)" }}
            >
              {[
                { label: "Based on", value: "Top Tracks · Last 6 Months" },
                { label: "Track count", value: "20 songs" },
                { label: "Visibility", value: "Public on Spotify" },
                { label: "Name", value: "Willow Playlist 🌿" },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between ${i < arr.length - 1 ? "mb-3 border-b pb-3" : ""}`}
                  style={{ borderColor: theme.palette.border }}
                >
                  <span className="text-xs" style={{ color: theme.palette.muted }}>
                    {row.label}
                  </span>
                  <span className="text-xs font-semibold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {error ? (
            <div className="mb-4">
              <ErrorState title="Playlist failed" message={error} onRetry={createPlaylist} />
            </div>
          ) : null}

          {playlistUrl ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
                style={{
                  borderColor: theme.palette.accent,
                  color: theme.palette.accent,
                  background: `${theme.palette.accentSoft}`,
                }}
              >
                ✓ Playlist created successfully
              </div>
              <GlowButton className="w-full py-4" onClick={openPlaylist}>
                <span className="inline-flex items-center gap-2">
                  Open on Spotify <ExternalLink size={15} />
                </span>
              </GlowButton>
              <button
                onClick={() => { setPlaylistUrl(""); setError(""); }}
                className="mt-3 text-xs"
                style={{ color: theme.palette.muted }}
              >
                Generate another
              </button>
            </motion.div>
          ) : (
            <GlowButton
              className="w-full py-4"
              onClick={createPlaylist}
              disabled={isCreating}
            >
              {isCreating ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={15} className="animate-spin" />
                  Building your playlist…
                </span>
              ) : (
                "Generate Playlist"
              )}
            </GlowButton>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}

