"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCampaignType = exports.updateCampaignType = exports.createCampaignType = exports.getCampaignTypeById = exports.getAllCampaignTypes = exports.getCampaignTypesByTenant = void 0;
const CampaignType_1 = __importDefault(require("../models/CampaignType"));
const Campaign_1 = __importDefault(require("../models/Campaign"));
const getCampaignTypesByTenant = async (tenantId) => {
    return CampaignType_1.default.find({ tenant: tenantId }).sort({ createdAt: -1 }).lean();
};
exports.getCampaignTypesByTenant = getCampaignTypesByTenant;
const getAllCampaignTypes = async () => {
    return CampaignType_1.default.find()
        .populate('tenant', 'name slug')
        .sort({ createdAt: -1 })
        .lean();
};
exports.getAllCampaignTypes = getAllCampaignTypes;
const getCampaignTypeById = async (id) => {
    return CampaignType_1.default.findById(id).populate('tenant', 'name slug').lean();
};
exports.getCampaignTypeById = getCampaignTypeById;
const createCampaignType = async (data) => {
    const campaignType = new CampaignType_1.default(data);
    return campaignType.save();
};
exports.createCampaignType = createCampaignType;
const updateCampaignType = async (id, data) => {
    return CampaignType_1.default.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
};
exports.updateCampaignType = updateCampaignType;
const deleteCampaignType = async (id) => {
    await Campaign_1.default.deleteMany({ campaignType: id });
    return CampaignType_1.default.findByIdAndDelete(id);
};
exports.deleteCampaignType = deleteCampaignType;
