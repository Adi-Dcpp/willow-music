import { asyncHandler } from "../utils/async-handler.utils.js";
import { generatePersonalityReview } from "../services/ai.service.js";
import { getAIReviewCache, setAIReviewCache, hashSummary } from "../utils/cache.utils.js";

const FALLBACK_REVIEW = "Your taste is clean, intentional, and emotionally rich. You pick sounds that feel personal, not random.";

const reviewSummary = asyncHandler(async (req, res) => {
  const summary = req.body?.summary;
  const { userId } = req.user;

  if (!summary || typeof summary !== "object") {
    return res.status(400).json({
      review: FALLBACK_REVIEW,
    });
  }

  try {
    // Check cache first: userId + summary hash
    const summaryHash = hashSummary(summary);
    const cachedReview = getAIReviewCache(userId, summaryHash);

    if (cachedReview) {
      return res.status(200).json({ review: cachedReview, cached: true });
    }

    // Generate if not cached
    const review = await generatePersonalityReview(summary);

    // Store in cache
    setAIReviewCache(userId, summaryHash, review);

    return res.status(200).json({ review });
  } catch {
    return res.status(200).json({
      review: FALLBACK_REVIEW,
    });
  }
});

export { reviewSummary };
