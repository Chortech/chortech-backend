import Router from 'express';
import { BadRequestError, NotFoundError, requireAuth } from '@chortec/common';
import mongoose from 'mongoose';
import Group from '../models/group';


const router = Router();

router.get('/', requireAuth, async (req, res) => {
    if (!req.user) throw new BadRequestError('Invalid state!');
    
    const group = await Group.findById(req.group?.id);

    if (!group)
        throw new NotFoundError(`No group exists with id ${req.group?.id}`);

    if (!group.members?.includes(mongoose.Types.ObjectId(req.user.id)))
        throw new BadRequestError('You are not a member of this group!');
    
    res.status(200).json({ group });
});

export { router as getGroupRouter };