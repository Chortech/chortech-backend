import Router from 'express';
import { BadRequestError, ResourceConflictError, requireAuth } from '@chortec/common';
import { validate } from '@chortec/common';
import Joi from 'joi';
import User from '../models/user'
import Group from '../models/group';


const router = Router();

const addFriendsToGroupSchema = Joi.object({
    groupId: Joi.string(),
    friends: Joi.array().items(Joi.string())
}).label('body');

router.post('/', requireAuth, validate(addFriendsToGroupSchema), async (req, res) => {
    if (!req.user) throw new BadRequestError('Invalid state!');

    const { groupId, friends } = req.body;
    const id = req.user;

    const user = await User.findById(id);

    if (!user)
        throw new BadRequestError('Invalid state!');

    const group = await Group.findById(groupId);

    if (!group)
        throw new BadRequestError(`No groups exist with the id ${groupId}`);
        
    if (!group.members?.includes(user))
        throw new BadRequestError('You are not a member of this group!');
    
    for (let friendId of friends) {
        const friend = await User.findById(friendId);
        
        if (!friend)
            throw new BadRequestError(`There is no user with id ${friendId}`);
        
        if (group.members.includes(friend))
            throw new ResourceConflictError(`User ${friendId} is already in this group!`);
        
        group.members?.push(friend);
    }

    await group.save();

    res.status(200).send({
        id: groupId,
        name: group.name,
        creator: group.creator,
        members: group.members
    });
});

export { router as addFriendsToGroupRouter };