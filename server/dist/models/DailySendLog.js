"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const DailySendLogSchema = new mongoose_1.default.Schema({
    accountEmail: { type: String, required: true },
    dateStr: { type: String, required: true },
    count: { type: Number, default: 0 },
});
DailySendLogSchema.index({ accountEmail: 1, dateStr: 1 }, { unique: true });
exports.default = mongoose_1.default.model('DailySendLog', DailySendLogSchema);
