import { Snapshot } from "../models/snapshot.model.js";

const escapeXml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const generateOGImage = async (req, res) => {
  try {
    const { shareId } = req.params;

    const snapshot = await Snapshot.findOne({
      shareId,
      deletedAt: null,
    });

    if (!snapshot) {
      return res.status(404).send("Snapshot not found");
    }

    const { topArtists, insights } = snapshot;

    const topArtistNames = topArtists
      .slice(0, 3)
      .map((a) => a.name)
      .join(", ");

    const topGenre = insights?.topGenres?.[0]?.genre || "Music";

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
            <stop stop-color="#07111f" />
            <stop offset="1" stop-color="#10283f" />
          </linearGradient>
          <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(920 120) rotate(132) scale(390 280)">
            <stop stop-color="#74f7c6" stop-opacity="0.28" />
            <stop offset="1" stop-color="#74f7c6" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#bg)" />
        <rect width="1200" height="630" fill="url(#glow)" />
        <circle cx="150" cy="520" r="180" fill="#b6ff8a" fill-opacity="0.08" />
        <circle cx="1030" cy="120" r="130" fill="#7dd3fc" fill-opacity="0.08" />
        <text x="72" y="118" fill="#dffef0" font-size="28" font-family="Arial, Helvetica, sans-serif" letter-spacing="3">WILLOW</text>
        <text x="72" y="210" fill="#ffffff" font-size="64" font-family="Arial, Helvetica, sans-serif" font-weight="700">Spotify Snapshot</text>
        <text x="72" y="292" fill="#b9c8d6" font-size="30" font-family="Arial, Helvetica, sans-serif">Top Artists</text>
        <text x="72" y="342" fill="#ffffff" font-size="38" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeXml(topArtistNames || "Unknown")}</text>
        <text x="72" y="430" fill="#b9c8d6" font-size="30" font-family="Arial, Helvetica, sans-serif">Top Genre</text>
        <text x="72" y="480" fill="#ffffff" font-size="38" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeXml(topGenre)}</text>
      </svg>
    `.trim();

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    return res.send(svg);
  } catch (err) {
    return res.status(500).send("Failed to generate OG image");
  }
};