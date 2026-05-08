import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express, { Express } from 'express';

process.env.JWT_SECRET = 'test-jwt-secret';

import authRouter from '../../routes/auth';
import { errorHandler, notFound } from '../../middleware/errorHandler';

let mongod: MongoMemoryServer;
let app: Express;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
  app.use(notFound);
  app.use(errorHandler);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  for (const col of Object.values(mongoose.connection.collections)) {
    await col.deleteMany({});
  }
});

// ── Status ────────────────────────────────────────────────

describe('GET /auth/status', () => {
  it('returns hasUsers: false when the database is empty', async () => {
    const res = await request(app).get('/auth/status');
    expect(res.status).toBe(200);
    expect(res.body.data.hasUsers).toBe(false);
  });

  it('returns hasUsers: true once a user exists', async () => {
    await request(app).post('/auth/register').send({ username: 'admin', password: 'password123' });
    const res = await request(app).get('/auth/status');
    expect(res.body.data.hasUsers).toBe(true);
  });
});

// ── Register ─────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('creates the first user as active and returns a token', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ username: 'admin', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.username).toBe('admin');
  });

  it('returns 403 when a user already exists', async () => {
    await request(app).post('/auth/register').send({ username: 'admin', password: 'password123' });
    const res = await request(app)
      .post('/auth/register')
      .send({ username: 'another', password: 'password123' });
    expect(res.status).toBe(403);
  });

  it('returns 400 for a password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ username: 'admin', password: '123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when username is missing', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ username: 'admin' });
    expect(res.status).toBe(400);
  });
});

// ── Login ─────────────────────────────────────────────────

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/auth/register').send({ username: 'admin', password: 'password123' });
  });

  it('returns a token for valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.username).toBe('admin');
  });

  it('returns 401 for a wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for an unknown username', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'ghost', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when both fields are missing', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 403 for a pending user', async () => {
    // Register admin first (already done in beforeEach), then request access as another user
    await request(app)
      .post('/auth/request')
      .send({ username: 'pending_user', password: 'password123' });

    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'pending_user', password: 'password123' });
    expect(res.status).toBe(403);
  });
});

// ── Access Request ────────────────────────────────────────

describe('POST /auth/request', () => {
  it('returns 403 when no active users exist yet', async () => {
    const res = await request(app)
      .post('/auth/request')
      .send({ username: 'newuser', password: 'password123' });
    expect(res.status).toBe(403);
  });

  it('creates a pending user when an active user exists', async () => {
    await request(app).post('/auth/register').send({ username: 'admin', password: 'password123' });
    const res = await request(app)
      .post('/auth/request')
      .send({ username: 'requester', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('returns 409 when the username is already taken', async () => {
    await request(app).post('/auth/register').send({ username: 'admin', password: 'password123' });
    const res = await request(app)
      .post('/auth/request')
      .send({ username: 'admin', password: 'password123' });
    expect(res.status).toBe(409);
  });
});

// ── Approve / Reject ──────────────────────────────────────

describe('POST /auth/approve and /auth/reject', () => {
  let adminToken: string;

  beforeEach(async () => {
    const reg = await request(app)
      .post('/auth/register')
      .send({ username: 'admin', password: 'password123' });
    adminToken = reg.body.data.token;

    await request(app)
      .post('/auth/request')
      .send({ username: 'requester', password: 'password123' });
  });

  it('approves a pending user', async () => {
    const pending = await request(app)
      .get('/auth/pending')
      .set('Authorization', `Bearer ${adminToken}`);
    const userId = pending.body.data[0]._id;

    const res = await request(app)
      .post(`/auth/approve/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('active');
  });

  it('rejects a pending user', async () => {
    const pending = await request(app)
      .get('/auth/pending')
      .set('Authorization', `Bearer ${adminToken}`);
    const userId = pending.body.data[0]._id;

    const res = await request(app)
      .post(`/auth/reject/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('rejected');
  });

  it('returns 401 for protected routes without a token', async () => {
    const res = await request(app).get('/auth/pending');
    expect(res.status).toBe(401);
  });
});
