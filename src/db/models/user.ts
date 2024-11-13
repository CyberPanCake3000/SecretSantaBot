import mongoose, {Document, ObjectId, Schema} from 'mongoose';
export interface IUser extends Document {
  _id: ObjectId;
  telegramId: number;
  name: string;
  telegramUsername: string;
  groups: [
    {
      groupId: ObjectId;
      role: String;
      participationStatus: String;
      giftStatus: String;
      notificationEnabled: Boolean;
    },
  ];
  giftPreferences: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserGroupSchema = new Schema({
  groupId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Group',
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'participant'],
    default: 'participant',
  },
  participationStatus: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'declined'],
    default: 'pending',
  },
  giftStatus: {
    type: String,
    required: true,
    enum: ['bought', 'not_bought'],
    default: 'not_bought',
  },
  notificationEnabled: {
    type: Boolean,
    default: true,
  },
});

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
    telegramUsername: {
      type: String,
      required: true,
    },
    groups: {
      type: [UserGroupSchema],
      default: [],
    },
    giftPreferences: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

UserSchema.index({telegramId: 1}, {unique: true});
UserSchema.index({'groups.groupId': 1});

export const User = mongoose.model<IUser>('User', UserSchema);
