import Router from 'express';
import { BadRequestError, ResourceConflictError, requireAuth } from '@chortec/common';
import { validate } from '@chortec/common';
import Joi from 'joi';
import User from '../models/user';
import mongoose from 'mongoose';
import Group from '../models/group';


const router = Router();

const createGroupSchema = Joi.object({
    name: Joi.string()
}).label('body');

router.post('/', requireAuth, validate(createGroupSchema), async (req, res) => {
    if (!req.user) throw new BadRequestError('Invalid state!');

    const { name } = req.body;
    const creator_id = mongoose.Types.ObjectId(req.user.id);

    const creator = await User.findById(creator_id);

    if (!creator) {
        throw new BadRequestError('Invalid state!');
    }

    const members = [creator_id];

    const group = Group.build({
        name,
        creator: creator_id,
        members
    });

    const { _id } = await group.save();

    return res.status(201).send({
        id: _id,
        name,
        creator,
        members
    });
});

export { router as createGroupRouter };