import Router from 'express';
import { BadRequestError, NotFoundError, requireAuth } from '@chortec/common';
import Group from '../models/group';
import mongoose from 'mongoose';


const router = Router();

router.get('/', requireAuth, async (req, res) => {
    if (!req.user) throw new BadRequestError('Invalid state!');
    
    const exists = await Group.exists({ _id: req.group?.id });

    if (!exists)
        throw new NotFoundError(`No group exists with id ${req.group?.id}`);

    if (!(await Group.exists({ _id: req.group?.id, 
        members: { $in: [mongoose.Types.ObjectId(req.user.id)] } })))
        throw new BadRequestError('You are not a member of this group!');

    
    const group = await Group.findById(req.group?.id).populate('members').populate('creator');
    
    res.status(200).json({ group });
});

export { router as getGroupRouter };