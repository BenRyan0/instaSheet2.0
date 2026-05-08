"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Tenant_1 = __importDefault(require("../models/Tenant"));
const CampaignType_1 = __importDefault(require("../models/CampaignType"));
const DailySendLog_1 = __importDefault(require("../models/DailySendLog"));
const sheetsService_1 = require("../services/sheetsService");
const router = (0, express_1.Router)();
const CACHE_TTL_MS = parseInt(process.env.SHEETS_CACHE_TTL_MS ?? String(5 * 60 * 1000), 10);
const leadsCache = new Map();
// GET /stats/leads
// Query params:
//   tenantId — optional, filter to a single tenant
//   force    — set to 'true' to bypass the server-side cache
router.get('/leads', async (req, res, next) => {
    try {
        const { tenantId, force } = req.query;
        const cacheKey = tenantId && typeof tenantId === 'string' ? tenantId : 'all';
        const forceRefresh = force === 'true';
        if (!forceRefresh) {
            const cached = leadsCache.get(cacheKey);
            if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
                return res.json({ success: true, data: cached.data, count: cached.data.length, cachedAt: cached.cachedAt });
            }
        }
        const tenantQuery = tenantId && typeof tenantId === 'string' ? { _id: tenantId } : {};
        const tenants = await Tenant_1.default.find(tenantQuery).lean();
        const allResults = [];
        // Sequential — avoids blasting all tenant batchGet calls at the same instant
        for (const tenant of tenants) {
            const credentials = tenant.credentials;
            if (!credentials?.googleServiceAccountJson || !tenant.googleSheetId)
                continue;
            const campaignTypes = await CampaignType_1.default.find({ tenant: tenant._id })
                .select('_id name sheetName')
                .lean();
            if (campaignTypes.length === 0)
                continue;
            const results = await (0, sheetsService_1.getLeadCountsForTenant)(String(tenant._id), tenant.name, tenant.googleSheetId, credentials.googleServiceAccountJson, campaignTypes.map((ct) => ({ _id: String(ct._id), name: ct.name, sheetName: ct.sheetName })));
            allResults.push(...results);
        }
        const cachedAt = Date.now();
        leadsCache.set(cacheKey, { data: allResults, cachedAt });
        res.json({ success: true, data: allResults, count: allResults.length, cachedAt });
    }
    catch (err) {
        next(err);
    }
});
// GET /stats/sending-capacity
router.get('/sending-capacity', async (_req, res, next) => {
    try {
        const capacity = parseInt(process.env.DAILY_SEND_CAPACITY ?? '50', 10);
        const dateStr = new Date().toISOString().slice(0, 10);
        const logs = await DailySendLog_1.default.find({ dateStr }).sort({ accountEmail: 1 }).lean();
        const accounts = logs.map((l) => ({
            accountEmail: l.accountEmail,
            used: l.count,
            capacity,
        }));
        const totalUsed = logs.reduce((sum, l) => sum + l.count, 0);
        const totalCapacity = capacity * (accounts.length || 1);
        res.json({ success: true, dateStr, capacity, totalUsed, totalCapacity, accounts });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
