import mongoose, { Schema, Document } from 'mongoose';

/**
 * @param name
 * @param creator
 * @param users
 */


interface IGroup {
    name: string;
    creator: mongoose.Types.ObjectId;
    members?: mongoose.Types.ObjectId[];
}

type GroupDoc = IGroup & Document;

interface GroupModel extends mongoose.Model<GroupDoc> {
    build(group: IGroup): GroupDoc;
}

const groupSchema = new Schema({
    name: { type: String, required: true },
    creator: { type: String, ref: 'User', required: true },
    members: [{ type: String, ref: 'User' }]
});

groupSchema.statics.build = (group: IGroup) => new Group(group);

const Group = mongoose.model<GroupDoc, GroupModel>('Group', groupSchema);

export { Group };

export default Group;