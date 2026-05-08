"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CampaignSchema = new mongoose_1.default.Schema({
    campaignId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    campaignType: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'CampaignType',
        required: true,
    },
    tenant: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
exports.default = mongoose_1.default.model('Campaign', CampaignSchema);
