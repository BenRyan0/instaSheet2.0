"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const errorHandler = (err, _req, res, _next) => {
    // Mongoose duplicate key error
    if (err.code === 11000 && err.keyValue) {
        const field = Object.keys(err.keyValue)[0];
        res.status(409).json({
            success: false,
            message: `Duplicate value for field: ${field}`,
            field,
        });
        return;
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        res.status(400).json({ success: false, message: err.message });
        return;
    }
    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json({ success: false, message: 'Invalid ID format' });
        return;
    }
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal server error',
    });
};
exports.errorHandler = errorHandler;
const notFound = (_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
};
exports.notFound = notFound;
