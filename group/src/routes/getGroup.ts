import Router from 'express';
import { BadRequestError, NotFoundError, requireAuth, UnauthorizedError } from '@chortec/common';
import { validate } from '@chortec/common';
import Joi from 'joi';
import User from '../models/user'
import Group from '../models/group';


const router = Router();

router.get('/', requireAuth, async (req, res) => {
    if (!req.user) throw new BadRequestError('Invalid state!');
    
    const group = await Group.findById(req.group?.id);

    if (!group)
        throw new NotFoundError(`No group exists with id ${req.group?.id}`);

    const id = req.user;

    const user = await User.findById(id);

    if (!user)
        throw new BadRequestError('Invalid State!');

    if (!group.members?.includes(user))
        throw new UnauthorizedError();
    
    res.status(200).json({ group });
});