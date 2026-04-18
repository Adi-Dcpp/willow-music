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

const generatePersonalityReview = async (summary) => {
  if (!validateSummary(summary)) {
    throw new Error("Invalid summary payload");
  }

  const topGenres = Array.isArray(summary.topGenres) ? summary.topGenres.slice(0, 3) : [];
  const topArtist = typeof summary.topArtist === "string" ? summary.topArtist : "Unknown";
  const vibe = typeof summary.vibe === "string" ? summary.vibe : "Balanced Listener";
  const depthScore = typeof summary.depthScore === "number" ? summary.depthScore : 0;

  const prompt = [
    "You are a music personality writer.",
    "Write exactly 2 to 3 short lines.",
    "Tone: Gen Z, aesthetic, positive, and non-generic.",
    "No hashtags, no emojis spam, no bullet points.",
    `Top genres: ${topGenres.join(", ") || "Unknown"}`,
    `Top artist: ${topArtist}`,
    `Vibe: ${vibe}`,
    `Depth score: ${depthScore}`,
  ].join("\n");

  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.8,
    max_tokens: 140,
    messages: [
      {
        role: "system",
        content: "Keep responses concise, stylish, warm, and human.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return completion.choices?.[0]?.message?.content?.trim() || "Your music taste feels intentional and vibrant, with a clear emotional signature.";
};

export { generatePersonalityReview };
