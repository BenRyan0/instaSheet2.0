import mongoose, { Document } from 'mongoose';

export interface IDailySendLog extends Document {
  accountEmail: string;
  dateStr: string;
  count: number;
}

const DailySendLogSchema = new mongoose.Schema<IDailySendLog>({
  accountEmail: { type: String, required: true },
  dateStr:      { type: String, required: true },
  count:        { type: Number, default: 0 },
});

DailySendLogSchema.index({ accountEmail: 1, dateStr: 1 }, { unique: true });

export default mongoose.model<IDailySendLog>('DailySendLog', DailySendLogSchema);
