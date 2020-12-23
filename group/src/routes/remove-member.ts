import Router from 'express';
import { BadRequestError, requireAuth, NotFoundError, validate } from '@chortec/common';
import Group from '../models/group';
import Joi from 'joi';


const router = Router();

const removeMemberSchema = Joi.object({
  member: Joi.string()
}).label('body');

router.put('/', requireAuth, validate(removeMemberSchema), async (req, res) => {
  if (!req.user) throw new BadRequestError('Invalid state!');

  const { member } = req.body;

  const group = await Group.findById(req.group?.id);

  if (!group)
    throw new NotFoundError(`No groups exist with the id ${req.group?.id}` );
  
  if (!group.members?.includes(req.user.id))
    throw new BadRequestError('You are not a member of this group!');
  
  if (group.creator == member)
    throw new BadRequestError('You cannot remove this user because they are the owner of the group!');
    
  if (group.expenseChecks.get(member))
    throw new BadRequestError('You cannot remove this member because he participates in an active expense!');
  
  const index = group.members ? group.members?.indexOf(member, 0) : -1;
  if (index <= -1)
      throw new BadRequestError('You are not a member of this group!');

  group.members?.splice(index, 1);
  group.expenseChecks.delete(member);

  await group.save();

  res.status(200).json({ group });
});

export { router as removeMemberRouter };