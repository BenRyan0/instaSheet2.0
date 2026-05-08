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
const campaignService = __importStar(require("../services/campaignService"));
const router = (0, express_1.Router)();
// GET /campaigns?tenantId=xxx&campaignTypeId=yyy
router.get('/', async (req, res, next) => {
    try {
        const { tenantId, campaignTypeId } = req.query;
        const campaigns = await campaignService.getCampaigns({
            tenantId: typeof tenantId === 'string' ? tenantId : undefined,
            campaignTypeId: typeof campaignTypeId === 'string' ? campaignTypeId : undefined,
        });
        res.json({ success: true, data: campaigns, count: campaigns.length });
    }
    catch (err) {
        next(err);
    }
});
// GET /campaigns/:id
router.get('/:id', async (req, res, next) => {
    try {
        const campaign = await campaignService.getCampaignById(req.params.id);
        if (!campaign) {
            res.status(404).json({ success: false, message: 'Campaign not found' });
            return;
        }
        res.json({ success: true, data: campaign });
    }
    catch (err) {
        next(err);
    }
});
// POST /campaigns
router.post('/', async (req, res, next) => {
    try {
        const campaign = await campaignService.createCampaign(req.body);
        res.status(201).json({ success: true, data: campaign });
    }
    catch (err) {
        next(err);
    }
});
// PUT /campaigns/:id
router.put('/:id', async (req, res, next) => {
    try {
        const campaign = await campaignService.updateCampaign(req.params.id, req.body);
        if (!campaign) {
            res.status(404).json({ success: false, message: 'Campaign not found' });
            return;
        }
        res.json({ success: true, data: campaign });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /campaigns/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const campaign = await campaignService.deleteCampaign(req.params.id);
        if (!campaign) {
            res.status(404).json({ success: false, message: 'Campaign not found' });
            return;
        }
        res.json({ success: true, message: 'Campaign deleted' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
