"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DataRequest_1 = __importDefault(require("../models/DataRequest"));
const router = (0, express_1.Router)();
// GET /data-requests?isResolved=false&sheetName=xxx&campaignId=yyy&limit=100&skip=0
router.get('/', async (req, res, next) => {
    try {
        const { isResolved, sheetName, campaignId, limit = '100', skip = '0' } = req.query;
        const filter = {};
        if (isResolved !== undefined)
            filter.isResolved = isResolved === 'true';
        if (typeof sheetName === 'string')
            filter.sheetName = sheetName;
        if (typeof campaignId === 'string')
            filter.campaign_id = campaignId;
        const [total, items] = await Promise.all([
            DataRequest_1.default.countDocuments(filter),
            DataRequest_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(Number(skip))
                .limit(Number(limit))
                .lean(),
        ]);
        res.json({ success: true, total, items });
    }
    catch (err) {
        next(err);
    }
});
// GET /data-requests/:id
router.get('/:id', async (req, res, next) => {
    try {
        const doc = await DataRequest_1.default.findById(req.params.id).lean();
        if (!doc) {
            res.status(404).json({ success: false, message: 'DataRequest not found' });
            return;
        }
        res.json({ success: true, data: doc });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /data-requests/:id/resolve — manually mark as resolved
router.patch('/:id/resolve', async (req, res, next) => {
    try {
        const doc = await DataRequest_1.default.findByIdAndUpdate(req.params.id, { $set: { isResolved: true } }, { new: true }).lean();
        if (!doc) {
            res.status(404).json({ success: false, message: 'DataRequest not found' });
            return;
        }
        res.json({ success: true, data: doc });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
