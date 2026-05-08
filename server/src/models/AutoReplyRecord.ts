import mongoose, { Document } from 'mongoose';

export interface IAutoReplyRecord extends Document {
  lead_email: string;
  campaign_id: string;
  googleSheetId: string;
  sheetName: string;
  sheetRowNumber: number;
  emailAccount: string;
  replyEmailId: string;
  replySubject: string;
  followUpCount: number;
  lastFollowUpAt: Date | null;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AutoReplyRecordSchema = new mongoose.Schema<IAutoReplyRecord>(
  {
    lead_email:      { type: String, required: true, index: true },
    campaign_id:     { type: String, required: true, index: true },
    googleSheetId:   { type: String, required: true },
    sheetName:       { type: String, required: true },
    sheetRowNumber:  { type: Number, required: true },
    emailAccount:    { type: String, default: '' },
    replyEmailId:    { type: String, default: '' },
    replySubject:    { type: String, default: '' },
    followUpCount:   { type: Number, default: 0, index: true },
    lastFollowUpAt:  { type: Date, default: null },
    isResolved:      { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

AutoReplyRecordSchema.index({ lead_email: 1, campaign_id: 1 });
AutoReplyRecordSchema.index({ isResolved: 1, followUpCount: 1 });

export default mongoose.model<IAutoReplyRecord>('AutoReplyRecord', AutoReplyRecordSchema);
