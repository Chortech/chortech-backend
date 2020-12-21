import Router from 'express';
import { BadRequestError, ResourceConflictError, requireAuth, NotFoundError } from '@chortec/common';
import { validate } from '@chortec/common';
import Joi from 'joi';
import mongoose, { mongo } from 'mongoose';
import Group from '../models/group';
import User from '../models/user';


const router = Router();

const addMembersToGroupSchema = Joi.object({
    members: Joi.array().items(Joi.string())
}).label('body');

router.put('/', requireAuth, validate(addMembersToGroupSchema), async (req, res) => {
  if (!req.user) throw new BadRequestError('Invalid state!');

  const { members } = req.body;
  const user = mongoose.Types.ObjectId(req.user.id);

  if (!user)
    throw new BadRequestError('Invalid state!');

  const group = await Group.findById(req.group?.id);

  if (!group)
    throw new NotFoundError(`No groups exist with the id ${req.group?.id}`);
  
  if (!group.members?.includes(user))
    throw new BadRequestError('You are not a member of this group!');
  
  for (let memberId of members) {
    const member = mongoose.Types.ObjectId(memberId);

    if (!User.exists(member))
      throw new BadRequestError(`There is no user with id ${memberId}`);

    if (group.members?.includes(member))
      throw new ResourceConflictError(`User ${memberId} is already in this group!`);

    group.members?.push(member);
  }

  await group.save();

  res.status(200).send({
    name: group.name,
    creator: group.creator,
    members: group.members
  });
});

export { router as addMembersToGroupRouter };