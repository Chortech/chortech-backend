import { BadRequestError, NotFoundError, validate, requireAuth } from '@chortec/common';
import { Router } from 'express';
import Joi, { exist } from 'joi';
import Group from '../models/group';
import mongoose from 'mongoose';


const router = Router();

const editGroupInfoSchema = Joi.object().keys({
  picture: Joi.string().allow(null),
  name: Joi.string().allow(null)
}).or('picture', 'name');

router.patch('/', requireAuth, validate(editGroupInfoSchema), async (req, res) => {
  if (!req.user) throw new BadRequestError('Invalid state!');

  const { picture, name } = req.body;

  const group = await Group.findById(req.group?.id).populate('members').populate('creator');
  const user = mongoose.Types.ObjectId(req.user.id);

  if (!group)
    throw new NotFoundError(`No groups exist with the id ${req.group?.id}`);

  if (await Group.exists({ _id: req.group?.id, members: { $nin: [user] } }))
    throw new BadRequestError('You are not a member of this group!');

  if (name)
      group.name = name;
  if (picture)
    group.picture = picture;
  
  await group.save();

  res.status(200).json(group);
});

export { router as editGroupInfoRouter };