import Router from 'express';
import { BadRequestError, NotFoundError, requireAuth, UnauthorizedError } from '@chortec/common';
import mongoose from 'mongoose';
import Group from '../models/group';


const router = Router();

router.get('/', requireAuth, async (req, res) => {
    if (!req.user) throw new BadRequestError('Invalid state!');
    
    const group = await Group.findById(req.group?.id);

    if (!group)
        throw new NotFoundError(`No group exists with id ${req.group?.id}`);

    const user = mongoose.Types.ObjectId(req.user.id);

    if (!user)
        throw new BadRequestError('Invalid State!');

    if (!group.members?.includes(user))
        throw new BadRequestError('You are not a member of this group!');
    
    res.status(200).json({ group });
});

export { router as getGroupRouter };