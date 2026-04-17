import { ApiError } from "../utils/api-error.utils.js";
import { rateLimit } from "express-rate-limit";

const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,

    handler: (req, res, next) => {
        next(
            new ApiError(
                429,
                "Too many requests from this IP, please try again after 15 minutes"
            )
        );
    },
});

export {
    rateLimiter
};