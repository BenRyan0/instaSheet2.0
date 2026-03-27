import mongoose, { Document, Types } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  slug: string;
  googleSheetId: string;
  credentials: {
    instantlyApiKey: string;
    openAiApiKey: string;
    googleServiceAccountJson: Record<string, unknown>;
  };
  limits: {
    maxRequestsPerMinute: number;
    maxLeadsPerRun: number;
  };
  settings: {
    schedulerIntervalMinutes: number;
    successDelayMs: number;
    leadDelayJitterMs: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new mongoose.Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    googleSheetId: { type: String, required: true },
    credentials: {
      instantlyApiKey: { type: String, required: true },
      openAiApiKey: { type: String, required: true },
      googleServiceAccountJson: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    limits: {
      maxRequestsPerMinute: { type: Number, default: 60 },
      maxLeadsPerRun: { type: Number, default: 100 },
    },
    settings: {
      schedulerIntervalMinutes: { type: Number, default: 1 },
      successDelayMs: { type: Number, default: 10000 },
      leadDelayJitterMs: { type: Number, default: 3000 },
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITenant>('Tenant', TenantSchema);
