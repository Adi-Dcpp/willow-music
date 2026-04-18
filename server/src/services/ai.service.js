import Groq from "groq-sdk";

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  return new Groq({ apiKey });
};

const validateSummary = (summary) => {
  if (!summary || typeof summary !== "object") {
    return false;
  }

  const topGenres = Array.isArray(summary.topGenres) ? summary.topGenres : [];
  const topArtist = typeof summary.topArtist === "string" ? summary.topArtist : "Unknown";

  return topGenres.length > 0 || topArtist !== "Unknown";
};

const normalizeReview = (text) => {
  const cleaned = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "Willow sees a taste that feels intentional and vibrant, with a clear emotional signature.";
  }

  if (/\bwillow\b/i.test(cleaned)) {
    return cleaned;
  }

  return `Willow says: ${cleaned}`;
};

const generatePersonalityReview = async (summary, displayName = "listener") => {
  if (!validateSummary(summary)) {
    throw new Error("Invalid summary payload");
  }

  const topGenres = Array.isArray(summary.topGenres) ? summary.topGenres.slice(0, 3) : [];
  const topArtist = typeof summary.topArtist === "string" ? summary.topArtist : "Unknown";
  const vibe = typeof summary.vibe === "string" ? summary.vibe : "Balanced Listener";
  const depthScore = typeof summary.depthScore === "number" ? summary.depthScore : 0;
  const safeDisplayName = String(displayName || "listener").trim();
  const genreLine = topGenres.join(", ") || "Unknown";

  const prompt = [
    "Task: write a short music identity review for a snapshot card.",
    "Output: exactly 2 to 3 short lines, plain text only.",
    "Voice: warm, stylish, confident, non-cringe, non-generic.",
    "No hashtags. No bullet points. Max one emoji total.",
    "Mention Willow naturally exactly once.",
    `User name: ${safeDisplayName}`,
    `Top genres: ${genreLine}`,
    `Top artist: ${topArtist}`,
    `Vibe: ${vibe}`,
    `Depth score: ${depthScore}`,
    "Mention the user name naturally once.",
    "If top artist is Taylor Swift, you may reference Swiftie energy naturally.",
    "Do not mention any artist, genre, or fact that is not in the provided input.",
    "Do not invent songs, eras, or listening behavior.",
    "Keep lines story-shareable and punchy.",
  ].join("\n");

  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.65,
    max_tokens: 140,
    messages: [
      {
        role: "system",
        content:
          "You are Willow's music identity copywriter. Be concise, factual to provided inputs, and emotionally vivid.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const rawReview = completion.choices?.[0]?.message?.content;
  return normalizeReview(rawReview);
};

export { generatePersonalityReview };
