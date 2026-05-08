"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
process.env.JWT_SECRET = 'test-jwt-secret';
const auth_1 = __importDefault(require("../../routes/auth"));
const errorHandler_1 = require("../../middleware/errorHandler");
let mongod;
let app;
beforeAll(async () => {
    mongod = await mongodb_memory_server_1.MongoMemoryServer.create();
    await mongoose_1.default.connect(mongod.getUri());
    app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use('/auth', auth_1.default);
    app.use(errorHandler_1.notFound);
    app.use(errorHandler_1.errorHandler);
});
afterAll(async () => {
    await mongoose_1.default.disconnect();
    await mongod.stop();
});
afterEach(async () => {
    for (const col of Object.values(mongoose_1.default.connection.collections)) {
        await col.deleteMany({});
    }
});
// ── Status ────────────────────────────────────────────────
describe('GET /auth/status', () => {
    it('returns hasUsers: false when the database is empty', async () => {
        const res = await (0, supertest_1.default)(app).get('/auth/status');
        expect(res.status).toBe(200);
        expect(res.body.data.hasUsers).toBe(false);
    });
    it('returns hasUsers: true once a user exists', async () => {
        await (0, supertest_1.default)(app).post('/auth/register').send({ username: 'admin', password: 'password123' });
        const res = await (0, supertest_1.default)(app).get('/auth/status');
        expect(res.body.data.hasUsers).toBe(true);
    });
});
// ── Register ─────────────────────────────────────────────
describe('POST /auth/register', () => {
    it('creates the first user as active and returns a token', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/auth/register')
            .send({ username: 'admin', password: 'password123' });
        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('token');
        expect(res.body.data.status).toBe('active');
        expect(res.body.data.username).toBe('admin');
    });
    it('returns 403 when a user already exists', async () => {
        await (0, supertest_1.default)(app).post('/auth/register').send({ username: 'admin', password: 'password123' });
        const res = await (0, supertest_1.default)(app)
            .post('/auth/register')
            .send({ username: 'another', password: 'password123' });
        expect(res.status).toBe(403);
    });
    it('returns 400 for a password shorter than 6 characters', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/auth/register')
            .send({ username: 'admin', password: '123' });
        expect(res.status).toBe(400);
    });
    it('returns 400 when username is missing', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/auth/register')
            .send({ password: 'password123' });
        expect(res.status).toBe(400);
    });
    it('returns 400 when password is missing', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/auth/register')
            .send({ username: 'admin' });
        expect(res.status).toBe(400);
    });
});
// ── Login ─────────────────────────────────────────────────
describe('POST /auth/login', () => {
    beforeEach(async () => {
        await (0, supertest_1.default)(app).post('/auth/register').send({ username: 'admin', password: 'password123' });
    });
    it('returns a token for valid credentials', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/auth/login')
            .send({ username: 'admin', password: 'password123' });
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('token');
        expect(res.body.data.username).toBe('admin');
    });
    it('returns 401 for a wrong password', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/auth/login')
            .send({ username: 'admin', password: 'wrongpassword' });
        expect(res.status).toBe(401);
    });
    it('returns 401 for an unknown username', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/auth/login')
            .send({ username: 'ghost', password: 'password123' });
        expect(res.status).toBe(401);
    });
    it('returns 400 when both fields are missing', async () => {
        const res = await (0, supertest_1.default)(app).post('/auth/login').send({});
        expect(res.status).toBe(400);
    });
    it('returns 403 for a pending user', async () => {
        // Register admin first (already done in beforeEach), then request access as another user
        await (0, supertest_1.default)(app)
            .post('/auth/request')
            .send({ username: 'pending_user', password: 'password123' });
        const res = await (0, supertest_1.default)(app)
            .post('/auth/login')
            .send({ username: 'pending_user', password: 'password123' });
        expect(res.status).toBe(403);
    });
});
// ── Access Request ────────────────────────────────────────
describe('POST /auth/request', () => {
    it('returns 403 when no active users exist yet', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/auth/request')
            .send({ username: 'newuser', password: 'password123' });
        expect(res.status).toBe(403);
    });
    it('creates a pending user when an active user exists', async () => {
        await (0, supertest_1.default)(app).post('/auth/register').send({ username: 'admin', password: 'password123' });
        const res = await (0, supertest_1.default)(app)
            .post('/auth/request')
            .send({ username: 'requester', password: 'password123' });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });
    it('returns 409 when the username is already taken', async () => {
        await (0, supertest_1.default)(app).post('/auth/register').send({ username: 'admin', password: 'password123' });
        const res = await (0, supertest_1.default)(app)
            .post('/auth/request')
            .send({ username: 'admin', password: 'password123' });
        expect(res.status).toBe(409);
    });
});
// ── Approve / Reject ──────────────────────────────────────
describe('POST /auth/approve and /auth/reject', () => {
    let adminToken;
    beforeEach(async () => {
        const reg = await (0, supertest_1.default)(app)
            .post('/auth/register')
            .send({ username: 'admin', password: 'password123' });
        adminToken = reg.body.data.token;
        await (0, supertest_1.default)(app)
            .post('/auth/request')
            .send({ username: 'requester', password: 'password123' });
    });
    it('approves a pending user', async () => {
        const pending = await (0, supertest_1.default)(app)
            .get('/auth/pending')
            .set('Authorization', `Bearer ${adminToken}`);
        const userId = pending.body.data[0]._id;
        const res = await (0, supertest_1.default)(app)
            .post(`/auth/approve/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('active');
    });
    it('rejects a pending user', async () => {
        const pending = await (0, supertest_1.default)(app)
            .get('/auth/pending')
            .set('Authorization', `Bearer ${adminToken}`);
        const userId = pending.body.data[0]._id;
        const res = await (0, supertest_1.default)(app)
            .post(`/auth/reject/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('rejected');
    });
    it('returns 401 for protected routes without a token', async () => {
        const res = await (0, supertest_1.default)(app).get('/auth/pending');
        expect(res.status).toBe(401);
    });
});
