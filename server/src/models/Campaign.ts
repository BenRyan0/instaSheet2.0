import mongoose, { Document, Types } from 'mongoose';

export interface ICampaign extends Document {
  campaignId: string;
  name: string;
  campaignType: Types.ObjectId;
  tenant: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new mongoose.Schema<ICampaign>(
  {
    campaignId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    campaignType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CampaignType',
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICampaign>('Campaign', CampaignSchema);
