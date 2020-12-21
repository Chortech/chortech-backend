import Router from 'express';
import { BadRequestError, UnauthorizedError, requireAuth, NotFoundError } from '@chortec/common';
import mongoose from 'mongoose';
import Group, { IMember } from '../models/group';


const router = Router();

router.delete('/', requireAuth, async (req, res) => {
  if (!req.user) throw new BadRequestError('Invalid state!');

  const group = await Group.findById(req.group?.id);
    
  if (!group)
      throw new NotFoundError(`No groups exist with the id ${req.group?.id}`);
    
  if (group.creator.id.toHexString() != req.user.id)
      throw new BadRequestError('You are not the owner of this group!');
    
  for(let member of group.members!) {
    if (member.expenseCheck)
      throw new BadRequestError('You cannot delete this group because of existing expenses!');
  }

  await Group.deleteOne(group);

  res.status(200).send({
    message: 'Deleted the group successfully!'
  });
});

export { router as deleteGroupRouter };