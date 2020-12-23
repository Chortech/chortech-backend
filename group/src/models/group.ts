import mongoose, { Schema, Document } from 'mongoose';

/**
 * @param name
 * @param creator
 * @param users
 */


interface IGroup {
  name: string;
  picture?: string;
  creator: string;
  members?: string[];
  expenseChecks: Map<string, boolean>;
}

type GroupDoc = IGroup & Document;

interface GroupModel extends mongoose.Model<GroupDoc> {
  build(group: IGroup): GroupDoc;
}

const groupSchema = new Schema({
  name: { type: String, required: true },
  picture: String,
  creator: { type: String, ref: 'User', required: true },
  members: [{ type: String }],
  expenseChecks: Map
});

groupSchema.statics.build = (group: IGroup) => new Group(group);

const Group = mongoose.model<GroupDoc, GroupModel>("Group", groupSchema);

export { Group };

export default Group;
