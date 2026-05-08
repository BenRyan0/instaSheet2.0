"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler_1 = require("../../middleware/errorHandler");
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const req = {};
const next = jest.fn();
describe('errorHandler middleware', () => {
    it('returns 409 for Mongoose duplicate key error (code 11000)', () => {
        const err = { name: 'MongoServerError', message: 'dup key', code: 11000, keyValue: { username: 'admin' } };
        const res = mockRes();
        (0, errorHandler_1.errorHandler)(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, field: 'username' }));
    });
    it('returns 400 for Mongoose ValidationError', () => {
        const err = { name: 'ValidationError', message: 'required field missing' };
        const res = mockRes();
        (0, errorHandler_1.errorHandler)(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'required field missing' }));
    });
    it('returns 400 for Mongoose CastError (bad ObjectId)', () => {
        const err = { name: 'CastError', message: 'Cast to ObjectId failed' };
        const res = mockRes();
        (0, errorHandler_1.errorHandler)(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Invalid ID format' }));
    });
    it('returns the error statusCode when set', () => {
        const err = { name: 'Error', message: 'Not found', statusCode: 404 };
        const res = mockRes();
        (0, errorHandler_1.errorHandler)(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
    });
    it('defaults to 500 for unrecognised errors', () => {
        const err = { name: 'Error', message: 'Unexpected crash' };
        const res = mockRes();
        (0, errorHandler_1.errorHandler)(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Unexpected crash' }));
    });
});
describe('notFound handler', () => {
    it('returns 404 with a route-not-found message', () => {
        const res = mockRes();
        (0, errorHandler_1.notFound)(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
});
