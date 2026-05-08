import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFound, AppError } from '../../middleware/errorHandler';

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const req = {} as Request;
const next = jest.fn() as NextFunction;

describe('errorHandler middleware', () => {
  it('returns 409 for Mongoose duplicate key error (code 11000)', () => {
    const err: AppError = { name: 'MongoServerError', message: 'dup key', code: 11000, keyValue: { username: 'admin' } };
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, field: 'username' })
    );
  });

  it('returns 400 for Mongoose ValidationError', () => {
    const err: AppError = { name: 'ValidationError', message: 'required field missing' };
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'required field missing' })
    );
  });

  it('returns 400 for Mongoose CastError (bad ObjectId)', () => {
    const err: AppError = { name: 'CastError', message: 'Cast to ObjectId failed' };
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Invalid ID format' })
    );
  });

  it('returns the error statusCode when set', () => {
    const err: AppError = { name: 'Error', message: 'Not found', statusCode: 404 };
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('defaults to 500 for unrecognised errors', () => {
    const err: AppError = { name: 'Error', message: 'Unexpected crash' };
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Unexpected crash' })
    );
  });
});

describe('notFound handler', () => {
  it('returns 404 with a route-not-found message', () => {
    const res = mockRes();

    notFound(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});
