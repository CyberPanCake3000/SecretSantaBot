import mongoose, {Document, Schema} from 'mongoose';

export interface IUser extends Document {
  telegramId: number;
  name: string;
  wishes: string;
  budget: number;
  giftForUser: mongoose.Types.ObjectId | null;
  giftBought: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    telegramId: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    wishes: {
      type: String,
      default: '',
    },
    budget: {
      type: Number,
      default: 0,
    },
    giftForUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    giftBought: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
