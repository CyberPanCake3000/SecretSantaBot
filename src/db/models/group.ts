import mongoose, {Document, ObjectId, Schema} from 'mongoose';

export interface IGroup extends Document {
  _id: ObjectId;
  telegramGroupName: string;
  telegramGroupId: number;
  adminTelegramId: number;
  adminUsername: string;
  eventDate: Date;
  eventInfo: string;
  minPrice: number;
  maxPrice: number;
  participants: {
    userTelegramId: number;
    username: string;
    joinedAt: Date;
    participationStatus: string; // pending/checked-in/canceled
  }[];
  isActive: boolean;
  isDraw: boolean;
  createdAt: Date;
  santaPairs: {
    santaTelegramId: number;
    recipientTelegramId: number;
    santaUsername: string;
    recipientUsername: string;
    manuallyAssigned: boolean;
  }[];
}

export const GroupSchema: Schema = new Schema({
  telegramGroupName: {
    type: String,
    required: true,
  },
  telegramGroupId: {
    type: String,
    required: true,
  },
  adminTelegramId: {
    type: Number,
    required: true,
  },
  adminUsername: {
    type: String,
  },
  eventDate: {
    type: Date,
    required: true,
  },
  eventInfo: {
    type: String,
    default: '',
  },
  minPrice: {
    type: Number,
    required: true,
  },
  maxPrice: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDraw: {
    type: Boolean,
    default: false,
  },
  participants: [
    {
      userTelegramId: {
        type: Number,
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      participationStatus: {
        type: String,
        required: true,
      },
    },
  ],
  santaPairs: [
    {
      santaTelegramId: {
        type: Number,
        required: true,
      },
      recipientTelegramId: {
        type: Number,
        required: true,
      },
      santaUsername: {
        type: String,
      },
      recipientUsername: {
        type: String,
      },
      manuallyAssigned: {
        type: Boolean,
        default: false,
      },
    },
  ],
});

GroupSchema.index({adminTelegramId: 1});
GroupSchema.index({telegramGroupId: 1}, {unique: true});
GroupSchema.index({'participants.userTelegramId': 1});

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
