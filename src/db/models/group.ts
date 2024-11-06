import mongoose, {Document, ObjectId, Schema} from 'mongoose';

export interface IGroup extends Document {
  _id: ObjectId;
  name: string;
  uniqueCode: string;
  createdAt: Date;
  updatedAt: Date;
  eventDate: Date;
  eventInfo: string;
  adminTelegramId: Number;
  adminUsername: string;
  giftPriceRange: {
    min: number;
    max: number;
  };
  allowedUsers: [
    {
      userTelegramId: number;
      status: string; //pending / confirmed
      invitedAt: Date;
    },
  ];
  status: string;
  drawStatus: string;
  participants: [
    {
      userTelegramId: number;
      username: string;
      joinedAt: Date;
      participationStatus: string; // pending/checked-in/canceled
    },
  ];
  santaPairs: [
    {
      santaTelegramId: number;
      recipientTelegramId: number;
      santaUsername: string;
      recipientUsername: string;
      giftStatus: string;
      manuallyAssigned: boolean;
    },
  ];
}

export const GroupSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    uniqueCode: {
      type: String,
      required: true,
      unique: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    eventInfo: {
      type: String,
      default: '',
    },
    adminTelegramId: {
      type: Number,
      required: true,
    },
    adminUsername: {
      type: String,
      required: true,
    },
    giftPriceRange: {
      min: {
        type: Number,
        required: true,
      },
      max: {
        type: Number,
        required: true,
      },
    },
    allowedUsers: [
      {
        userTelegramId: {
          type: Number,
          rquired: true,
        },
        status: {
          type: String,
          required: true,
        },
        invitedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      required: true,
    },
    drawStatus: {
      type: String,
      required: true,
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
          required: true,
        },
        recipientUsername: {
          type: String,
          required: true,
        },
        giftStatus: {
          type: String,
          required: true,
        },
        manuallyAssigned: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

GroupSchema.index({uniqueCode: 1}, {unique: true});
GroupSchema.index({adminTelegramId: 1});
GroupSchema.index({'participants.userTelegramId': 1});

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
