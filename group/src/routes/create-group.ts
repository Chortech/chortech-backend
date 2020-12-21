import Router from 'express';
import { BadRequestError, ResourceConflictError, requireAuth } from '@chortec/common';
import { validate } from '@chortec/common';
import Joi from 'joi';
import mongoose from 'mongoose';
import Group, { IExpensCheck } from '../models/group';


const router = Router();

const createGroupSchema = Joi.object({
    name: Joi.string()
}).label('body');

router.post('/', requireAuth, validate(createGroupSchema), async (req, res) => {
  if (!req.user) throw new BadRequestError('Invalid state!');

  const { name } = req.body;

  const creator = mongoose.Types.ObjectId(req.user.id);

  if (!creator)
    throw new BadRequestError('Invalid state!');

  const members = [creator];
  const expenseCheck: IExpensCheck = {
    id: creator,
    expenseCheck: false
  }
  const expenseChecks: IExpensCheck[] = [expenseCheck];

  const group = Group.build({
    name,
    creator,
    members,
    expenseChecks
  });

  const { _id } = await group.save();

  res.status(201).send({
    id: _id,
    name,
    creator,
    members,
    expenseChecks
  });
});

export { router as createGroupRouter };