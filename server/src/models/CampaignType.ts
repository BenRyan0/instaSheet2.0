import mongoose, { Document, Types } from 'mongoose';

export type AddressMapping = 'direct' | 'parse' | 'skip';

export interface IAutoReply {
  enabled: boolean;
  subject: string;
  bodyHtml: string;
  bodyText: string;
}

export interface IAutoReplyFollowUp {
  enabled: boolean;
  intervalHours: number;
  maxFollowUps: number;
  bodyText: string;
  link: string;
}

export interface IDataRequestFollowUp {
  enabled: boolean;
  requiredFields: string[];
  subject: string;
  bodyText: string;
  priorityField: string;
}

export interface ICallback {
  enabled: boolean;
  url: string;
}

export interface ICampaignType extends Document {
  tenant: Types.ObjectId;
  name: string;
  sheetName: string;
  emailTemplate: string;
  sheetHeaders: string[];
  manualColCount: number;
  addressMapping: AddressMapping;
  autoReply: IAutoReply;
  autoReplyFollowUp: IAutoReplyFollowUp;
  dataRequestFollowUp: IDataRequestFollowUp;
  replyPlaybook: Record<string, unknown> | null;
  callback: ICallback;
  followUpReply: boolean;
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
    autoReply: {
      enabled:  { type: Boolean, default: false },
      subject:  { type: String, default: '' },
      bodyHtml: { type: String, default: '' },
      bodyText: { type: String, default: '' },
    },
    autoReplyFollowUp: {
      enabled:       { type: Boolean, default: false },
      intervalHours: { type: Number, default: 24 },
      maxFollowUps:  { type: Number, default: 1 },
      bodyText:      { type: String, default: '' },
      link:          { type: String, default: '' },
    },
    dataRequestFollowUp: {
      enabled:        { type: Boolean, default: false },
      requiredFields: { type: [String], default: [] },
      subject:        { type: String, default: '' },
      bodyText:       { type: String, default: '' },
      priorityField:  { type: String, default: '' },
    },
    replyPlaybook: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    callback: {
      enabled: { type: Boolean, default: false },
      url:     { type: String, default: '' },
    },
    followUpReply: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// A tenant cannot have two campaign types pointing to the same sheet tab.
CampaignTypeSchema.index({ tenant: 1, sheetName: 1 }, { unique: true });

export default mongoose.model<ICampaignType>('CampaignType', CampaignTypeSchema);
