"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./env"); // must be first — loads .env before any other module reads process.env
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("./routes/auth"));
const tenants_1 = __importDefault(require("./routes/tenants"));
const campaignTypes_1 = __importDefault(require("./routes/campaignTypes"));
const campaigns_1 = __importDefault(require("./routes/campaigns"));
const stats_1 = __importDefault(require("./routes/stats"));
const dataRequests_1 = __importDefault(require("./routes/dataRequests"));
const autoReplyRecords_1 = __importDefault(require("./routes/autoReplyRecords"));
const errorHandler_1 = require("./middleware/errorHandler");
const requireAuth_1 = require("./middleware/requireAuth");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mateker';
// Middleware
app.use((0, cors_1.default)({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Public auth routes
app.use('/api/auth', auth_1.default);
// All routes below require a valid JWT
app.use('/api/tenants', requireAuth_1.requireAuth, tenants_1.default);
app.use('/api/campaign-types', requireAuth_1.requireAuth, campaignTypes_1.default);
app.use('/api/campaigns', requireAuth_1.requireAuth, campaigns_1.default);
app.use('/api/stats', requireAuth_1.requireAuth, stats_1.default);
app.use('/api/data-requests', requireAuth_1.requireAuth, dataRequests_1.default);
app.use('/api/auto-reply-records', requireAuth_1.requireAuth, autoReplyRecords_1.default);
// Error handling
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
// Connect to MongoDB and start server
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})
    .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
