import OpenAI from "openai";
import { asyncHandler } from "../utils/async-handler.utils.js";
import { ApiError } from "../utils/api-error.utils.js";
import { ApiResponse } from "../utils/api-response.utils.js";

// ── Template-based fallback (no API key required) ──────────────────────────

const VIBE_ARCHETYPES = [
  {
    match: ["indie", "alternative", "dream pop", "shoegaze"],
    archetype: "Indie Dreamer",
    lines: [
      "You live somewhere between the first track and the last light of the day.",
      "Your playlist feels like a film nobody made yet — but someone should.",
      "You don't just listen to music. You wear it.",
    ],
  },
  {
    match: ["hip hop", "rap", "trap", "drill", "boom bap"],
    archetype: "Street Poet",
    lines: [
      "Every bar you replay is a mirror you're not afraid to look into.",
      "You hear the city in the beat before the words even land.",
      "Rhythm isn't something you follow — it's something you lead.",
    ],
  },
  {
    match: ["r&b", "soul", "neo soul", "funk"],
    archetype: "Soul Tender",
    lines: [
      "You feel the frequency before you hear the melody.",
      "Your taste is intimate — music as a private language.",
      "Warmth isn't just a feeling for you. It's a genre.",
    ],
  },
  {
    match: ["electronic", "edm", "techno", "house", "trance", "dance"],
    archetype: "Eternal Dancer",
    lines: [
      "You chase the drop the way others chase sunrises.",
      "For you, music is architecture — every layer is load-bearing.",
      "The night doesn't end until the bass says so.",
    ],
  },
  {
    match: ["pop", "synth-pop", "electropop"],
    archetype: "Chart Chameleon",
    lines: [
      "You know what's next before it charts — that's a superpower.",
      "You find depth in the accessible. That's harder than it sounds.",
      "Your taste is a bridge between what's now and what's next.",
    ],
  },
  {
    match: ["jazz", "blues", "swing"],
    archetype: "Jazz Wanderer",
    lines: [
      "You hear the space between the notes as loudly as the notes themselves.",
      "Your musical identity is timeless — it doesn't trend, it endures.",
      "Improvisation is your native language.",
    ],
  },
  {
    match: ["metal", "heavy metal", "death metal", "post-metal"],
    archetype: "Dark Edge",
    lines: [
      "You don't turn the volume down. The world turns it up to meet you.",
      "Your taste is an act of defiance — and that's the point.",
      "Intensity isn't something you tolerate. It's something you require.",
    ],
  },
  {
    match: ["folk", "acoustic", "singer-songwriter", "country"],
    archetype: "Wandering Folk",
    lines: [
      "You find poetry in the plain-spoken. That's rare.",
      "Your playlists feel like late-night conversations that go somewhere.",
      "You listen for the story, not just the sound.",
    ],
  },
  {
    match: ["lo-fi", "lo fi", "chillhop", "ambient", "downtempo"],
    archetype: "Lo-Fi Soul",
    lines: [
      "You use music the way others use candlelight.",
      "Your listening is meditative, even when you're not trying to be.",
      "You've made an art form out of slowing down.",
    ],
  },
  {
    match: ["classical", "orchestral", "opera", "chamber"],
    archetype: "Classical Phantom",
    lines: [
      "You hear centuries of emotion in a single movement.",
      "Your relationship with music is architectural — structure is your aesthetic.",
      "You don't just appreciate complexity. You seek it.",
    ],
  },
];

const DEFAULT_ARCHETYPE = {
  archetype: "Sonic Wanderer",
  lines: [
    "Your taste refuses to be categorised — and that's the highest compliment.",
    "You listen across boundaries because you don't believe in them.",
    "Genre is a suggestion. You treat it as one.",
  ],
};

/**
 * Generates a template-based personality review from the user's music summary.
 * Matches the top genres against VIBE_ARCHETYPES to select curated copy lines,
 * then weaves in drift and artist context for a personalised result.
 *
 * @param {{ topGenres: Array<string|{genre:string}>, topArtist?: string, tasteDriftScore?: number }} summary
 * @returns {string} a 3–5 sentence personality review
 */
function deriveTemplateReview(summary) {
  const { topGenres = [], topArtist = "", tasteDriftScore = 0 } = summary;
  const genreStr = topGenres
    .map((g) => (typeof g === "string" ? g : g.genre))
    .join(" ")
    .toLowerCase();

  let archetype = DEFAULT_ARCHETYPE;
  for (const entry of VIBE_ARCHETYPES) {
    if (entry.match.some((keyword) => genreStr.includes(keyword))) {
      archetype = entry;
      break;
    }
  }

  const driftLine =
    tasteDriftScore >= 70
      ? "You're always discovering — your taste is in constant bloom."
      : tasteDriftScore >= 40
      ? "You balance new finds with the sounds that shaped you."
      : "You've found your signature sound and you're loyal to it.";

  const artistLine = topArtist
    ? `Right now, ${topArtist} says something the rest of your list can't.`
    : null;

  const lines = [archetype.lines[0], driftLine, archetype.lines[1]];
  if (artistLine) lines.push(artistLine);
  lines.push(archetype.lines[2]);

  return `${lines.join(" ")}`;
}

// ── AI review handler ───────────────────────────────────────────────────────

const generateAIReview = asyncHandler(async (req, res) => {
  const { summary } = req.body;

  if (!summary || typeof summary !== "object") {
    throw new ApiError(400, "A valid summary object is required.");
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // If no API key, use the high-quality template system
  if (!apiKey) {
    const review = deriveTemplateReview(summary);
    return res
      .status(200)
      .json(new ApiResponse(200, "AI review generated", { review }));
  }

  const { topGenres = [], topArtist = "", tasteDriftScore = 0 } = summary;
  const genreNames = topGenres
    .map((g) => (typeof g === "string" ? g : g.genre))
    .slice(0, 5)
    .join(", ");

  const prompt = `You are a poetic, emotionally intelligent music critic writing a short personality profile for someone based on their listening habits.

Listening data:
- Top genres: ${genreNames || "varied"}
- Top artist right now: ${topArtist || "unknown"}
- Taste drift score: ${tasteDriftScore}/100 (higher = rapidly evolving taste, lower = loyal to a signature sound)

Write 3–4 sentences that feel cinematic, personal, and emotionally resonant. Avoid clichés. Do not use bullet points or markdown. Write in second person ("You…"). The tone should feel like a thoughtful friend who truly understands their music.`;

  try {
    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.85,
    });

    const review = completion.choices[0]?.message?.content?.trim() || deriveTemplateReview(summary);

    return res
      .status(200)
      .json(new ApiResponse(200, "AI review generated", { review }));
  } catch {
    // Graceful fallback on OpenAI errors
    const review = deriveTemplateReview(summary);
    return res
      .status(200)
      .json(new ApiResponse(200, "AI review generated", { review }));
  }
});

export { generateAIReview };
