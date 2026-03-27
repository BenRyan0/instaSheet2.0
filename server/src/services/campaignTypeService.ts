import CampaignType, { ICampaignType } from '../models/CampaignType';
import Campaign from '../models/Campaign';

export const getCampaignTypesByTenant = async (tenantId: string) => {
  return CampaignType.find({ tenant: tenantId }).sort({ createdAt: -1 }).lean();
};

export const getAllCampaignTypes = async () => {
  return CampaignType.find()
    .populate('tenant', 'name slug')
    .sort({ createdAt: -1 })
    .lean();
};

export const getCampaignTypeById = async (id: string) => {
  return CampaignType.findById(id).populate('tenant', 'name slug').lean();
};

export const createCampaignType = async (data: Partial<ICampaignType>) => {
  const campaignType = new CampaignType(data);
  return campaignType.save();
};

export const updateCampaignType = async (id: string, data: Partial<ICampaignType>) => {
  return CampaignType.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
};

export const deleteCampaignType = async (id: string) => {
  await Campaign.deleteMany({ campaignType: id });
  return CampaignType.findByIdAndDelete(id);
};
