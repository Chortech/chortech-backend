import mongoose, { Schema, Document } from 'mongoose';

/**
 * @param name
 * @param creator
 * @param users
 */


interface IMember {
  id: mongoose.Types.ObjectId;
  expenseCheck: boolean;
}

interface IGroup {
  name: string;
  creator: IMember;
  members?: IMember[];
}

type GroupDoc = IGroup & Document;

interface GroupModel extends mongoose.Model<GroupDoc> {
  build(group: IGroup): GroupDoc;
}

const groupSchema = new Schema({
  name: { type: String, required: true },
  creator: { type: Map, ref: 'User', required: true },
  members: [{ type: Map }]
});

groupSchema.statics.build = (group: IGroup) => new Group(group);

const Group = mongoose.model<GroupDoc, GroupModel>('Group', groupSchema);

export { Group, IMember };

export default Group;