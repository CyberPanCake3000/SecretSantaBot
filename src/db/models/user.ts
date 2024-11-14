import mongoose, {Document, ObjectId, Schema} from 'mongoose';
export interface IUser extends Document {
  _id: ObjectId;
  telegramId: number;
  telegramUsername?: string;
  telegramFirstName: string;
  telegramLastName?: string;
  wishes: string;
  groups: [
    {
      groupId: ObjectId;
      role: String;
      participationStatus: String;
      notificationEnabled: Boolean;
    },
  ];
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
    telegramUsername: {
      type: String,
    },
    telegramFirstName: {
      type: String,
    },
    telegramLastName: {
      type: String,
    },
    groups: {
      type: [UserGroupSchema],
      default: [],
    },
    wishes: {
      type: String,
      default: '',
    },
  },
  {
    versionKey: false,
  }
);

UserSchema.index({telegramId: 1}, {unique: true});
UserSchema.index({'groups.groupId': 1});

export const User = mongoose.model<IUser>('User', UserSchema);
