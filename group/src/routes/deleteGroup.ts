import Router from 'express';
import { BadRequestError, UnauthorizedError, requireAuth } from '@chortec/common';
import { validate } from '@chortec/common';
import Joi from 'joi';
import User from '../models/user'
import Group from '../models/group';


const router = Router();

const deleteGroupSchema = Joi.object({
    groupId: Joi.string()
}).label('body');

router.delete('/', requireAuth, validate(deleteGroupSchema), async (req, res) => {
    if (!req.user) throw new BadRequestError('Invalid state!');

    const { groupId } = req.body;
    const id = req.user;

    const user = await User.findById(id);
    const group = await Group.findById(groupId);

    if (!user)
        throw new BadRequestError('Invalid state!');
    
    if (!group)
        throw new BadRequestError(`No groups exist with the id ${groupId}`);
    
    if (group.creator != user)
        throw new UnauthorizedError();
    
    await Group.deleteOne(group);

    res.status(200).send({
        message: 'Deleted the group successfully!'
    });
});

export { router as deleteGroupRouter };