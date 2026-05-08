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
const campaignTypeService = __importStar(require("../services/campaignTypeService"));
const router = (0, express_1.Router)();
// GET /campaign-types?tenantId=xxx
router.get('/', async (req, res, next) => {
    try {
        const { tenantId } = req.query;
        let campaignTypes;
        if (tenantId && typeof tenantId === 'string') {
            campaignTypes = await campaignTypeService.getCampaignTypesByTenant(tenantId);
        }
        else {
            campaignTypes = await campaignTypeService.getAllCampaignTypes();
        }
        res.json({ success: true, data: campaignTypes, count: campaignTypes.length });
    }
    catch (err) {
        next(err);
    }
});
// GET /campaign-types/:id
router.get('/:id', async (req, res, next) => {
    try {
        const campaignType = await campaignTypeService.getCampaignTypeById(req.params.id);
        if (!campaignType) {
            res.status(404).json({ success: false, message: 'Campaign type not found' });
            return;
        }
        res.json({ success: true, data: campaignType });
    }
    catch (err) {
        next(err);
    }
});
// POST /campaign-types
router.post('/', async (req, res, next) => {
    try {
        const campaignType = await campaignTypeService.createCampaignType(req.body);
        res.status(201).json({ success: true, data: campaignType });
    }
    catch (err) {
        next(err);
    }
});
// PUT /campaign-types/:id
router.put('/:id', async (req, res, next) => {
    try {
        const allowed = [
            'name', 'sheetName', 'emailTemplate', 'sheetHeaders',
            'manualColCount', 'addressMapping', 'isActive',
            'autoReply', 'autoReplyFollowUp', 'dataRequestFollowUp',
            'replyPlaybook', 'callback',
        ];
        const body = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
        const { dataRequestFollowUp, sheetHeaders } = body;
        // Validate requiredFields against the campaign type's sheetHeaders
        if (dataRequestFollowUp?.requiredFields?.length) {
            const existingHeaders = sheetHeaders ??
                (await campaignTypeService.getCampaignTypeById(req.params.id))?.sheetHeaders ?? [];
            const invalid = dataRequestFollowUp.requiredFields.filter((f) => !existingHeaders.includes(f));
            if (invalid.length) {
                res.status(400).json({
                    success: false,
                    message: `requiredFields contains values not in sheetHeaders: ${invalid.join(', ')}`,
                });
                return;
            }
        }
        // Validate bodyText is present when enabled
        if (dataRequestFollowUp?.enabled && !dataRequestFollowUp?.bodyText?.trim()) {
            res.status(400).json({ success: false, message: 'dataRequestFollowUp.bodyText is required when enabled' });
            return;
        }
        const campaignType = await campaignTypeService.updateCampaignType(req.params.id, body);
        if (!campaignType) {
            res.status(404).json({ success: false, message: 'Campaign type not found' });
            return;
        }
        res.json({ success: true, data: campaignType });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /campaign-types/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const campaignType = await campaignTypeService.deleteCampaignType(req.params.id);
        if (!campaignType) {
            res.status(404).json({ success: false, message: 'Campaign type not found' });
            return;
        }
        res.json({ success: true, message: 'Campaign type and related campaigns deleted' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
