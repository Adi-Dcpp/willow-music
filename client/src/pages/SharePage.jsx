import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { toBlob } from "html-to-image";
import { api } from "../api/client";
import GlassCard from "../components/common/GlassCard";
import InsightRing from "../components/common/InsightRing";
import { EmptyState, ErrorState, InlineLoader } from "../components/common/StatePanel";
import { useTheme } from "../context/ThemeContext";

const getSpotifyTrackUrl = (track) => {
  if (track?.spotifyUrl) return track.spotifyUrl;
  if (track?.external_urls?.spotify) return track.external_urls.spotify;
  if (track?.id) return `https://open.spotify.com/track/${track.id}`;
  return null;
};

const getTasteDriftMessage = (score) => {
  if (score >= 85) return "Boundary breaker: your rotation is in constant discovery mode.";
  if (score >= 65) return "Curious explorer: you regularly expand beyond your usual lane.";
  if (score >= 45) return "Balanced explorer: you mix comfort tracks with fresh finds.";
  if (score >= 25) return "Steady core: your taste is consistent with occasional detours.";
  return "Signature locked: you know your sound and stay true to it.";
};

const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
};

export default function SharePage() {
  const { id } = useParams();
  const { theme, setTheme } = useTheme();
  const snapshotRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shareHint, setShareHint] = useState("");
  const [isImageBusy, setIsImageBusy] = useState(false);

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
  const driftMessage = snapshot?.insights?.tasteDriftMessage || getTasteDriftMessage(drift);
  const displayName = snapshot?.displayName || "Your Vibe";
  const aiReview = snapshot?.aiReview || "Your music taste feels intentional, emotional, and uniquely yours.";
  const conciseReview = aiReview.length > 280 ? `${aiReview.slice(0, 277).trim()}...` : aiReview;

  const createSnapshotBlob = async () => {
    const node = snapshotRef.current;
    if (!node) {
      throw new Error("Snapshot card is not ready");
    }

    const exportWidth = 1080;
    const exportHeight = 1920;
    const framePadding = 36;
    const topPadding = 28;

    try {
      const cardBlob =
        (await toBlob(node, {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: "#13001f",
        })) ||
        (await toBlob(node, {
          pixelRatio: 1.5,
          cacheBust: true,
          backgroundColor: "#13001f",
        }));

      if (!cardBlob) {
        throw new Error("Could not render snapshot card");
      }

      const imageUrl = URL.createObjectURL(cardBlob);

      try {
        const image = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Could not load snapshot image"));
          img.src = imageUrl;
        });

        const canvas = document.createElement("canvas");
        canvas.width = exportWidth;
        canvas.height = exportHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Could not initialize canvas");
        }

        const bg = ctx.createLinearGradient(0, 0, 0, exportHeight);
        bg.addColorStop(0, "#18001f");
        bg.addColorStop(1, "#0d0014");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, exportWidth, exportHeight);

        const imgW = image.width || 1;
        const imgH = image.height || 1;
        const maxW = exportWidth - framePadding * 2;
        const maxH = exportHeight - topPadding - framePadding;
        const scale = Math.min(maxW / imgW, maxH / imgH);
        const drawW = Math.round(imgW * scale);
        const drawH = Math.round(imgH * scale);
        const drawX = Math.round((exportWidth - drawW) / 2);
        const drawY = topPadding;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(image, drawX, drawY, drawW, drawH);

        const finalBlob = await new Promise((resolve) => {
          canvas.toBlob((blob) => resolve(blob), "image/png", 1);
        });

        if (!finalBlob) {
          throw new Error("Could not finalize snapshot image");
        }

        return finalBlob;
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    } catch {
      throw new Error("Could not generate snapshot image");
    }
  };

  const downloadSnapshotImage = async () => {
    try {
      setShareHint("");
      setIsImageBusy(true);
      const blob = await createSnapshotBlob();

      if (!blob) {
        throw new Error("Could not generate snapshot image");
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `willow-snapshot-${(snapshot?.shareId || id).slice(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setShareHint("Snapshot image downloaded.");
    } catch (err) {
      setShareHint(err?.message || "Could not generate image right now.");
    } finally {
      setIsImageBusy(false);
    }
  };

  const shareToInstagram = async () => {
    try {
      setShareHint("");
      setIsImageBusy(true);
      const blob = await createSnapshotBlob();

      if (!blob) {
        throw new Error("Could not generate snapshot image");
      }

      const file = new File([blob], `willow-snapshot-${(snapshot?.shareId || id).slice(0, 8)}.png`, {
        type: "image/png",
      });

      const canNativeShareFile =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      if (canNativeShareFile) {
        await navigator.share({
          files: [file],
          title: `${displayName} · Willow Snapshot`,
          text: `${aiReview}\n\nEvery Era Has a Sound`,
        });
        setShareHint("Shared. Pick Instagram Story from your share sheet.");
        return;
      }

      await downloadSnapshotImage();

      if (isMobileDevice()) {
        window.location.href = "instagram://story-camera";
        setShareHint("Image downloaded. Opening Instagram app. If it does not open, upload from your gallery.");
      } else {
        setShareHint("Image downloaded. Open Instagram app and add it from your gallery to Story.");
      }
    } catch (err) {
      setShareHint(err?.message || "Could not open Instagram share.");
    } finally {
      setIsImageBusy(false);
    }
  };

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
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div
        ref={snapshotRef}
        className="mx-auto w-full max-w-xl overflow-hidden rounded-4xl border shadow-2xl"
        style={{ background: "radial-gradient(circle at top, rgba(255,255,255,0.12), transparent 42%), linear-gradient(180deg, #18001f 0%, #0d0014 100%)", borderColor: theme.palette.border }}
      >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pb-3 pt-4 text-center"
      >
        <p
          className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.palette.accent }}
        >
          Willow · Music Identity
        </p>
        <h1 className="text-3xl font-bold text-white">{displayName}</h1>
        <p className="mt-1 text-sm" style={{ color: theme.palette.muted }}>
          Your story-ready music DNA snapshot
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
          Snapshot #{(snapshot.shareId || id).slice(0, 8)}
        </p>
      </motion.div>

      <div className="px-5 pb-4">
        <GlassCard className="overflow-hidden p-0" hover={false}>
          <div className="h-1.5 w-full" style={{ background: theme.palette.button }} />
          <div className="p-5">
            <div className="mb-4 flex items-center gap-4">
              <img
                src={topArtists[0]?.imageUrl || topArtists[0]?.image || "https://placehold.co/128x128?text=W"}
                alt={displayName}
                className="h-16 w-16 rounded-full border object-cover"
                style={{ borderColor: theme.palette.accent }}
              />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
                  For {displayName}
                </p>
                <h2 className="truncate text-xl font-bold text-white">
                  {snapshot?.summary?.vibe || "Music DNA"}
                </h2>
                <p className="text-sm" style={{ color: theme.palette.muted }}>
                  {snapshot?.summary?.topArtist || "Your top artist"}
                </p>
              </div>
            </div>

            <div
              className="rounded-3xl border px-4 py-4"
              style={{ borderColor: theme.palette.border, background: "rgba(255,255,255,0.04)" }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
                Willow Review
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white">
                {conciseReview}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-[20px] border px-4 py-3" style={{ borderColor: theme.palette.border, background: "rgba(255,255,255,0.03)" }}>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">Taste Drift</p>
                <p className="text-lg font-bold text-white">{drift}/100</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">Top Era</p>
                <p className="text-sm font-semibold text-white">{snapshot?.timeRange || "medium_term"}</p>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: theme.palette.muted }}>
              {driftMessage}
            </p>
          </div>
        </GlassCard>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mb-5 grid grid-cols-1 gap-4 px-5"
      >
        <GlassCard className="overflow-hidden p-0" hover={false}>
          <div className="h-1.5 w-full" style={{ background: theme.palette.button }} />
          <div className="p-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
              Top Artists
            </p>
            <div className="space-y-3">
              {topArtists.slice(0, 5).map((artist, index) => (
                <div key={artist.id} className="flex items-center gap-3">
                  <span
                    className="rank-badge w-5 shrink-0 text-center text-[11px] font-bold"
                    style={{ color: index === 0 ? theme.palette.accent : "rgba(255,255,255,0.35)" }}
                  >
                    {index + 1}
                  </span>
                  <img
                    src={artist.imageUrl || artist.image || "https://placehold.co/72x72?text=A"}
                    alt={artist.name}
                    className="h-10 w-10 shrink-0 rounded-full border object-cover"
                    style={{ borderColor: theme.palette.border }}
                  />
                  <p className="truncate font-semibold text-white">{artist.name}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.palette.accent }}>
            Top Tracks
          </p>
          <div className="grid grid-cols-5 gap-2">
            {topTracks.slice(0, 5).map((track, index) => (
              <button
                key={track.id}
                className="text-left"
                onClick={() => {
                  const spotifyUrl = getSpotifyTrackUrl(track);
                  if (!spotifyUrl) return;
                  window.open(spotifyUrl, "_blank", "noopener,noreferrer");
                }}
              >
                <div className="relative">
                  <img
                    src={track.albumImageUrl || track.image || "https://placehold.co/88x88?text=T"}
                    alt={track.name}
                    className="h-14 w-full rounded-xl object-cover"
                  />
                  <span
                    className="rank-badge absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
                    style={{ background: index === 0 ? theme.palette.button : "rgba(0,0,0,0.65)" }}
                  >
                    {index + 1}
                  </span>
                </div>
                <p className="mt-1 truncate text-[10px] text-white/80">{track.name}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-4 rounded-2xl border p-3" style={{ borderColor: theme.palette.border, background: "rgba(255,255,255,0.03)" }}>
            <InsightRing value={drift} />
            <div>
              <p className="text-sm font-semibold text-white">Taste Drift</p>
              <p className="text-xs" style={{ color: theme.palette.muted }}>{drift}/100</p>
              <p className="mt-0.5 text-[11px]" style={{ color: theme.palette.muted }}>{driftMessage}</p>
            </div>
          </div>

          {computedGenres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {computedGenres.slice(0, 3).map((item, idx) => (
                <span
                  key={`${item.genre}-${idx}`}
                  className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-white"
                  style={{ borderColor: theme.palette.border, background: theme.palette.accentSoft }}
                >
                  {item.genre}
                </span>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>
      </div>

      <div className="mx-auto w-full max-w-md pt-2 lg:sticky lg:top-6 lg:max-w-none">
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

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <button
            onClick={downloadSnapshotImage}
            disabled={isImageBusy}
            className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-xs font-semibold text-white disabled:opacity-60"
            style={{ borderColor: theme.palette.border, background: "rgba(255,255,255,0.05)" }}
          >
            <Download size={14} />
            Download Image
          </button>

          <button
            onClick={shareToInstagram}
            disabled={isImageBusy}
            className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white disabled:opacity-60"
            style={{ background: theme.palette.button }}
          >
            <Share2 size={14} />
            Share to Instagram Story
          </button>
        </div>

        {shareHint ? (
          <p className="mt-3 text-center text-xs" style={{ color: theme.palette.muted }}>
            {shareHint}
          </p>
        ) : null}

        <p className="mt-4 text-center text-xs" style={{ color: theme.palette.muted }}>
          Made with Willow · Powered by Spotify
        </p>
      </div>
      </div>
    </div>
  );
}

