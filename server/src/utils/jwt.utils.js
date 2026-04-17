import jwt from "jsonwebtoken"

const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY,
    })
}

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY,
    })
}

export {
    generateAccessToken,
    generateRefreshToken
}