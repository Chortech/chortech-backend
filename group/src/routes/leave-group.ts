import Router from 'express';
import { BadRequestError, UnauthorizedError, requireAuth, NotFoundError } from '@chortec/common';
import Group from '../models/group';
import mongoose from 'mongoose';


const router = Router();

router.delete('/', requireAuth, async (req, res) => {
    if (!req.user) throw new BadRequestError('Invalid State!');

    const group = await Group.findById(req.group?.id);
    const user = mongoose.Types.ObjectId(req.user.id);
    
    if (!group)
        throw new NotFoundError(`No groups exist with the id ${req.group?.id}`);

    if (group.inActiveExpenses.includes(user))
        throw new BadRequestError('You cannot leave the group because you are a participant in an expense!');
    
    if (group.creator == user) {
        if (!group.members || group.members?.length == 1) {
            await Group.deleteOne(group);
            res.status(200).send('You left the group successfully.');
            return;
        } else {
            group.creator = group.members[0] != user ? group.members[0] : group.members[1];
        }
    }

    const index = group.members ? group.members?.indexOf(user, 0) : -1;
    if (index <= -1)
        throw new BadRequestError('You are not a member of this group!');

    group.members?.splice(index, 1);

    await group.save();

    res.status(200).send('You left the group successfully.');
});

export { router as leaveGroupRouter };