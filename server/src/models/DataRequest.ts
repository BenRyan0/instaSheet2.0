import mongoose, { Document } from 'mongoose';

export interface IDataRequest extends Document {
  lead_email: string;
  campaign_id: string;
  googleSheetId: string;
  sheetName: string;
  sheetRowNumber: number;
  requestedFields: string[];
  emailAccount: string;
  replyEmailId: string;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DataRequestSchema = new mongoose.Schema<IDataRequest>(
  {
    lead_email:      { type: String, required: true, index: true },
    campaign_id:     { type: String, required: true, index: true },
    googleSheetId:   { type: String, required: true },
    sheetName:       { type: String, required: true },
    sheetRowNumber:  { type: Number, required: true },
    requestedFields: { type: [String], default: [] },
    emailAccount:    { type: String, default: '' },
    replyEmailId:    { type: String, default: '' },
    isResolved:      { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

DataRequestSchema.index({ lead_email: 1, campaign_id: 1, isResolved: 1 });

export default mongoose.model<IDataRequest>('DataRequest', DataRequestSchema);
