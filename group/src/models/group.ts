import mongoose, { Schema, Document } from "mongoose";

interface IGroup {
  name: string;
  picture?: string;
  creator: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  inActiveExpenses: mongoose.Types.ObjectId[];
}

type GroupDoc = IGroup & Document;

interface GroupModel extends mongoose.Model<GroupDoc> {
  build(group: IGroup): GroupDoc;
}

const groupSchema = new Schema(
  {
    name: { type: String, required: true },
    picture: String,
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    inActiveExpenses: [{ type: Schema.Types.ObjectId }],
  },
  {
    toJSON: {
      transform: function (doc, ret, options) {
        const id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.inActiveExpenses;
        ret.id = id;
      },
    },
    timestamps: true,
  }
);

groupSchema.statics.build = (group: IGroup) => new Group(group);

const Group = mongoose.model<GroupDoc, GroupModel>("Group", groupSchema);

export { Group, GroupDoc };

export default Group;
