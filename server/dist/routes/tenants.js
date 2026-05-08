"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenantService = __importStar(require("../services/tenantService"));
const router = (0, express_1.Router)();
// GET /tenants
router.get('/', async (_req, res, next) => {
    try {
        const tenants = await tenantService.getAllTenants();
        res.json({ success: true, data: tenants, count: tenants.length });
    }
    catch (err) {
        next(err);
    }
});
// GET /tenants/:id
router.get('/:id', async (req, res, next) => {
    try {
        const tenant = await tenantService.getTenantById(req.params.id);
        if (!tenant) {
            res.status(404).json({ success: false, message: 'Tenant not found' });
            return;
        }
        res.json({ success: true, data: tenant });
    }
    catch (err) {
        next(err);
    }
});
// GET /tenants/:id/stats
router.get('/:id/stats', async (req, res, next) => {
    try {
        const stats = await tenantService.getTenantStats(req.params.id);
        res.json({ success: true, data: stats });
    }
    catch (err) {
        next(err);
    }
});
// GET /tenants/:id/instantly-campaigns
// Proxies the Instantly.ai v2 API using the tenant's stored API key,
// fetches all campaigns via cursor pagination and returns them newest-first.
router.get('/:id/instantly-campaigns', async (req, res, next) => {
    try {
        const tenant = await tenantService.getTenantById(req.params.id);
        if (!tenant) {
            res.status(404).json({ success: false, message: 'Tenant not found' });
            return;
        }
        const apiKey = (tenant.credentials?.instantlyApiKey ?? '').trim();
        if (!apiKey) {
            res.status(400).json({
                success: false,
                message: `No Instantly API key found for tenant "${tenant.name}". Go to Tenants → Edit → API Credentials tab and save the key.`,
            });
            return;
        }
        const BASE_URL = 'https://api.instantly.ai/api/v2/campaigns';
        const campaigns = [];
        let startingAfter = null;
        while (true) {
            const url = new URL(BASE_URL);
            url.searchParams.set('limit', '100');
            if (startingAfter)
                url.searchParams.set('starting_after', startingAfter);
            const response = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (!response.ok) {
                const errText = await response.text();
                res.status(response.status).json({ success: false, message: `Instantly API error: ${errText}` });
                return;
            }
            const data = await response.json();
            campaigns.push(...data.items);
            if (!data.next_starting_after)
                break;
            startingAfter = data.next_starting_after;
        }
        // Sort newest first
        campaigns.sort((a, b) => new Date(b.timestamp_created).getTime() - new Date(a.timestamp_created).getTime());
        res.json({ success: true, data: campaigns, count: campaigns.length });
    }
    catch (err) {
        next(err);
    }
});
// POST /tenants
router.post('/', async (req, res, next) => {
    try {
        const tenant = await tenantService.createTenant(req.body);
        res.status(201).json({ success: true, data: tenant });
    }
    catch (err) {
        next(err);
    }
});
// PUT /tenants/:id
router.put('/:id', async (req, res, next) => {
    try {
        const tenant = await tenantService.updateTenant(req.params.id, req.body);
        if (!tenant) {
            res.status(404).json({ success: false, message: 'Tenant not found' });
            return;
        }
        res.json({ success: true, data: tenant });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /tenants/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const tenant = await tenantService.deleteTenant(req.params.id);
        if (!tenant) {
            res.status(404).json({ success: false, message: 'Tenant not found' });
            return;
        }
        res.json({ success: true, message: 'Tenant and related data deleted' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
