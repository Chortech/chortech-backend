import Router from 'express';
import { BadRequestError, UnauthorizedError, requireAuth, NotFoundError } from '@chortec/common';
import Group from '../models/group';
import mongoose from 'mongoose';


const router = Router();

router.delete('/', requireAuth, async (req, res) => {
    if (!req.user) throw new BadRequestError('Invalid State!');

    const exists = await Group.exists({ _id: req.group?.id });
    const user = mongoose.Types.ObjectId(req.user.id);
    
    if (!exists)
        throw new NotFoundError(`No groups exist with the id ${req.group?.id}`);

    if (await Group.exists({ _id: req.group?.id, members: { $size: 1 } })) {
        await Group.deleteOne({ _id: req.group?.id });
        res.status(200).send('Deleted the group successfully!');
    }
    else if (await Group.exists({ _id: req.group?.id, inActiveExpenses: { $in: [user] } }))
        throw new BadRequestError('You cannot leave the group because you are a participant in an expense!');
    else if (await Group.exists({ _id: req.group?.id, members: { $nin: [user] } }))
        throw new BadRequestError('You are not a member of this group!');
    else if (await Group.exists({ _id: req.group?.id, creator: user })) {
        const group = await Group.findById(req.group?.id); 

        if (!group)
            throw new NotFoundError(`No groups with the id ${req.group?.id}`); 
            
        group.creator = group.members[0].toHexString() != req.user.id ? group.members[0] : group.members[1];

        await group.save();
    }
    
    const raw = await Group.updateOne(
        {
            _id: req.group?.id
        }, 
        { $pull: { members: user } }
    );

    if (raw.n === 0)
        throw new BadRequestError('Something went wrong when you tried to leave!');

    res.status(200).send('You left the group successfully.');
});

export { router as leaveGroupRouter };