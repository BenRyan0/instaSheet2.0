"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCampaign = exports.updateCampaign = exports.createCampaign = exports.getCampaignById = exports.getCampaigns = void 0;
const Campaign_1 = __importDefault(require("../models/Campaign"));
const getCampaigns = async (filters) => {
    const query = {};
    if (filters.tenantId)
        query.tenant = filters.tenantId;
    if (filters.campaignTypeId)
        query.campaignType = filters.campaignTypeId;
    return Campaign_1.default.find(query)
        .populate('tenant', 'name slug')
        .populate('campaignType', 'name sheetName')
        .sort({ createdAt: -1 })
        .lean();
};
exports.getCampaigns = getCampaigns;
const getCampaignById = async (id) => {
    return Campaign_1.default.findById(id)
        .populate('tenant', 'name slug')
        .populate('campaignType', 'name sheetName')
        .lean();
};
exports.getCampaignById = getCampaignById;
const createCampaign = async (data) => {
    const campaign = new Campaign_1.default(data);
    return campaign.save();
};
exports.createCampaign = createCampaign;
const updateCampaign = async (id, data) => {
    return Campaign_1.default.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
};
exports.updateCampaign = updateCampaign;
const deleteCampaign = async (id) => {
    return Campaign_1.default.findByIdAndDelete(id);
};
exports.deleteCampaign = deleteCampaign;
