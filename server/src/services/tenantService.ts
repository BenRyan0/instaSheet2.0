import Tenant, { ITenant } from '../models/Tenant';
import CampaignType from '../models/CampaignType';
import Campaign from '../models/Campaign';

export const getAllTenants = async () => {
  return Tenant.find().sort({ createdAt: -1 }).lean();
};

export const getTenantById = async (id: string) => {
  return Tenant.findById(id).lean();
};

export const createTenant = async (data: Partial<ITenant>) => {
  const tenant = new Tenant(data);
  return tenant.save();
};

export const updateTenant = async (id: string, data: Partial<ITenant>) => {
  return Tenant.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
};

export const deleteTenant = async (id: string) => {
  const campaignTypes = await CampaignType.find({ tenant: id }).select('_id').lean();
  const campaignTypeIds = campaignTypes.map((ct) => ct._id);

  await Campaign.deleteMany({ tenant: id });
  await CampaignType.deleteMany({ tenant: id });
  return Tenant.findByIdAndDelete(id);
};

export const getTenantStats = async (tenantId: string) => {
  const [campaignTypeCount, campaignCount] = await Promise.all([
    CampaignType.countDocuments({ tenant: tenantId }),
    Campaign.countDocuments({ tenant: tenantId }),
  ]);
  return { campaignTypeCount, campaignCount };
};
