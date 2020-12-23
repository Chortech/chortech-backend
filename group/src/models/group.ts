import mongoose, { Schema, Document } from 'mongoose';

/**
 * @param name
 * @param creator
 * @param users
 */


interface IExpensCheck {
  id: mongoose.Types.ObjectId;
  expenseCheck: boolean;
}

interface IGroup {
  name: string;
  creator: mongoose.Types.ObjectId;
  members?: mongoose.Types.ObjectId[];
  expenseChecks: Map<mongoose.Types.ObjectId, boolean>;
}

type GroupDoc = IGroup & Document;

interface GroupModel extends mongoose.Model<GroupDoc> {
  build(group: IGroup): GroupDoc;
}

const groupSchema = new Schema({
  name: { type: String, required: true },
  creator: { type: String, ref: 'User', required: true },
  members: [{ type: String }],
  expenseChecks: [{ type: Map }]
});

groupSchema.statics.build = (group: IGroup) => new Group(group);

const Group = mongoose.model<GroupDoc, GroupModel>('Group', groupSchema);

export { Group, IExpensCheck };

export default Group;