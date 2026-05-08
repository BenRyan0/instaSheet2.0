"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const DataRequestSchema = new mongoose_1.default.Schema({
    lead_email: { type: String, required: true, index: true },
    campaign_id: { type: String, required: true, index: true },
    googleSheetId: { type: String, required: true },
    sheetName: { type: String, required: true },
    sheetRowNumber: { type: Number, required: true },
    requestedFields: { type: [String], default: [] },
    emailAccount: { type: String, default: '' },
    replyEmailId: { type: String, default: '' },
    isResolved: { type: Boolean, default: false, index: true },
}, { timestamps: true });
DataRequestSchema.index({ lead_email: 1, campaign_id: 1, isResolved: 1 });
exports.default = mongoose_1.default.model('DataRequest', DataRequestSchema);
