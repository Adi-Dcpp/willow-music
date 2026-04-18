import jwt from "jsonwebtoken"

const normalizeExpiry = (value, fallback) => {
    if (typeof value !== "string") {
        return fallback
    }

    const trimmed = value.trim()
    return trimmed.length ? trimmed : fallback
}

const ACCESS_TOKEN_EXPIRY = normalizeExpiry(
    process.env.ACCESS_TOKEN_EXPIRY || process.env.ACCESS_TOKEN_EXPIRES_IN,
    "15m"
)

const REFRESH_TOKEN_EXPIRY = normalizeExpiry(
    process.env.REFRESH_TOKEN_EXPIRY || process.env.REFRESH_TOKEN_EXPIRES_IN,
    "1d"
)

const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn : ACCESS_TOKEN_EXPIRY,
    })
}

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn : REFRESH_TOKEN_EXPIRY,
    })
}

export {
    generateAccessToken,
    generateRefreshToken
}