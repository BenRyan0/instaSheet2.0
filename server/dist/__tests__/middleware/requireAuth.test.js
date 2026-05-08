"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const TEST_SECRET = 'test-jwt-secret';
process.env.JWT_SECRET = TEST_SECRET;
const requireAuth_1 = require("../../middleware/requireAuth");
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const mockNext = () => jest.fn();
describe('requireAuth middleware', () => {
    it('calls next() and attaches user payload for a valid token', () => {
        const token = jsonwebtoken_1.default.sign({ userId: 'abc123', username: 'admin' }, TEST_SECRET);
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = mockRes();
        const next = mockNext();
        (0, requireAuth_1.requireAuth)(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.userId).toBe('abc123');
        expect(req.username).toBe('admin');
    });
    it('returns 401 when Authorization header is absent', () => {
        const req = { headers: {} };
        const res = mockRes();
        const next = mockNext();
        (0, requireAuth_1.requireAuth)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
    it('returns 401 when header does not start with Bearer', () => {
        const req = { headers: { authorization: 'Token sometoken' } };
        const res = mockRes();
        const next = mockNext();
        (0, requireAuth_1.requireAuth)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
    it('returns 401 for a tampered / invalid token', () => {
        const req = { headers: { authorization: 'Bearer this.is.not.valid' } };
        const res = mockRes();
        const next = mockNext();
        (0, requireAuth_1.requireAuth)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
    it('returns 401 for an expired token', () => {
        const token = jsonwebtoken_1.default.sign({ userId: 'abc123', username: 'admin' }, TEST_SECRET, {
            expiresIn: -1,
        });
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = mockRes();
        const next = mockNext();
        (0, requireAuth_1.requireAuth)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
    it('returns 401 for a token signed with a different secret', () => {
        const token = jsonwebtoken_1.default.sign({ userId: 'abc123', username: 'admin' }, 'wrong-secret');
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = mockRes();
        const next = mockNext();
        (0, requireAuth_1.requireAuth)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});
