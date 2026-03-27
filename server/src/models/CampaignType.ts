import mongoose, { Document, Types } from 'mongoose';

export type AddressMapping = 'direct' | 'parse' | 'skip';

export interface ICampaignType extends Document {
  tenant: Types.ObjectId;
  name: string;
  sheetName: string;
  emailTemplate: string;
  sheetHeaders: string[];
  manualColCount: number;
  addressMapping: AddressMapping;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_SHEET_HEADERS = [
  'Date',
  'Hot Lead',
  'For Scheduling',
  'Sales Person',
  'Sales Person Email',
  'Lead First Name',
  'Lead Last Name',
  'Lead Email',
  'Phone From Reply',
  'Phone From Instantly',
  'Phone 2',
  'Phone 3',
  'Reply Text',
  'Email Signature',
  'Address',
  'City',
  'State',
  'Zip',
  'LinkedIn',
  'Details',
  'Campaign Name',
  '@dropdown',
];

const CampaignTypeSchema = new mongoose.Schema<ICampaignType>(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sheetName: { type: String, required: true, trim: true },
    emailTemplate: { type: String, default: '' },
    sheetHeaders: { type: [String], default: DEFAULT_SHEET_HEADERS },
    manualColCount: { type: Number, default: 6 },
    addressMapping: {
      type: String,
      enum: ['direct', 'parse', 'skip'],
      default: 'direct',
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// A tenant cannot have two campaign types pointing to the same sheet tab.
CampaignTypeSchema.index({ tenant: 1, sheetName: 1 }, { unique: true });

export default mongoose.model<ICampaignType>('CampaignType', CampaignTypeSchema);
