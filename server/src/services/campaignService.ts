import Campaign, { ICampaign } from '../models/Campaign';

export const getCampaigns = async (filters: { tenantId?: string; campaignTypeId?: string }) => {
  const query: Record<string, string> = {};
  if (filters.tenantId) query.tenant = filters.tenantId;
  if (filters.campaignTypeId) query.campaignType = filters.campaignTypeId;

  return Campaign.find(query)
    .populate('tenant', 'name slug')
    .populate('campaignType', 'name sheetName')
    .sort({ createdAt: -1 })
    .lean();
};

export const getCampaignById = async (id: string) => {
  return Campaign.findById(id)
    .populate('tenant', 'name slug')
    .populate('campaignType', 'name sheetName')
    .lean();
};

export const createCampaign = async (data: Partial<ICampaign>) => {
  const campaign = new Campaign(data);
  return campaign.save();
};

export const updateCampaign = async (id: string, data: Partial<ICampaign>) => {
  return Campaign.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
};

export const deleteCampaign = async (id: string) => {
  return Campaign.findByIdAndDelete(id);
};
