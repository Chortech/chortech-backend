import mongoose, { Schema, Document } from 'mongoose';
import { User, IUser } from './user';

/**
 * @param name
 * @param creator
 * @param users
 */


interface IGroup {
    name: string;
    creator: IUser;
    members?: Array<IUser>;
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