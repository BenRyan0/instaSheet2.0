"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenantStats = exports.deleteTenant = exports.updateTenant = exports.createTenant = exports.getTenantById = exports.getAllTenants = void 0;
const Tenant_1 = __importDefault(require("../models/Tenant"));
const CampaignType_1 = __importDefault(require("../models/CampaignType"));
const Campaign_1 = __importDefault(require("../models/Campaign"));
const getAllTenants = async () => {
    return Tenant_1.default.find().sort({ createdAt: -1 }).lean();
};
exports.getAllTenants = getAllTenants;
const getTenantById = async (id) => {
    return Tenant_1.default.findById(id).lean();
};
exports.getTenantById = getTenantById;
const createTenant = async (data) => {
    const tenant = new Tenant_1.default(data);
    return tenant.save();
};
exports.createTenant = createTenant;
const updateTenant = async (id, data) => {
    return Tenant_1.default.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
};
exports.updateTenant = updateTenant;
const deleteTenant = async (id) => {
    const campaignTypes = await CampaignType_1.default.find({ tenant: id }).select('_id').lean();
    const campaignTypeIds = campaignTypes.map((ct) => ct._id);
    await Campaign_1.default.deleteMany({ tenant: id });
    await CampaignType_1.default.deleteMany({ tenant: id });
    return Tenant_1.default.findByIdAndDelete(id);
};
exports.deleteTenant = deleteTenant;
const getTenantStats = async (tenantId) => {
    const [campaignTypeCount, campaignCount] = await Promise.all([
        CampaignType_1.default.countDocuments({ tenant: tenantId }),
        Campaign_1.default.countDocuments({ tenant: tenantId }),
    ]);
    return { campaignTypeCount, campaignCount };
};
exports.getTenantStats = getTenantStats;
