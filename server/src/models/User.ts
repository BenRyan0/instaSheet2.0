import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserStatus = 'active' | 'pending' | 'rejected';

export interface IUser extends Document {
  username: string;
  password: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    status: { type: String, enum: ['active', 'pending', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
