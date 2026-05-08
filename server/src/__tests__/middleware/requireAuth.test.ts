import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const TEST_SECRET = 'test-jwt-secret';
process.env.JWT_SECRET = TEST_SECRET;

import { requireAuth, AuthRequest } from '../../middleware/requireAuth';

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn() as NextFunction;

describe('requireAuth middleware', () => {
  it('calls next() and attaches user payload for a valid token', () => {
    const token = jwt.sign({ userId: 'abc123', username: 'admin' }, TEST_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockRes();
    const next = mockNext();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe('abc123');
    expect(req.username).toBe('admin');
  });

  it('returns 401 when Authorization header is absent', () => {
    const req = { headers: {} } as AuthRequest;
    const res = mockRes();
    const next = mockNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not start with Bearer', () => {
    const req = { headers: { authorization: 'Token sometoken' } } as AuthRequest;
    const res = mockRes();
    const next = mockNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a tampered / invalid token', () => {
    const req = { headers: { authorization: 'Bearer this.is.not.valid' } } as AuthRequest;
    const res = mockRes();
    const next = mockNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an expired token', () => {
    const token = jwt.sign({ userId: 'abc123', username: 'admin' }, TEST_SECRET, {
      expiresIn: -1,
    });
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockRes();
    const next = mockNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a token signed with a different secret', () => {
    const token = jwt.sign({ userId: 'abc123', username: 'admin' }, 'wrong-secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockRes();
    const next = mockNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
