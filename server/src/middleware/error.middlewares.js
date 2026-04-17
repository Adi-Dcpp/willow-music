import { ApiError } from "../utils/api-error.utils.js";

const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err instanceof ApiError ? err.statusCode : 500;
    const message = err instanceof ApiError ? err.message : "Internal Server Error";
    const errors = err instanceof ApiError ? err.errors : [];
    const stack = process.env.NODE_ENV === "production" ? null : err.stack;

    res.status(statusCode).json({
        success: false,
        message,
        errors,
        data: null,
        timestamp: new Date().toISOString(),
        stack,
    });
}

export {
    globalErrorHandler
}