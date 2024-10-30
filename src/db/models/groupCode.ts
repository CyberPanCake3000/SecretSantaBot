import mongoose, {Document, Schema, ObjectId} from 'mongoose';

export interface IGroupCode extends Document {
  _id: ObjectId;
  code: string;
  createdAt: Date;
  isDeprecated: boolean;
}

export const GroupCodeSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isDeprecated: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

GroupCodeSchema.index({code: 1}, {unique: true});

export const GroupCode = mongoose.model<IGroupCode>(
  'GroupCode',
  GroupCodeSchema
);
