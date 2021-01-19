import Router from "express";
import {
  BadRequestError,
  ResourceConflictError,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { validate, GroupUpdateType } from "@chortec/common";
import Joi from "joi";
import Group from "../models/group";
import User from "../models/user";
import mongoose from "mongoose";
import { GroupUpdatedPublisher } from "../publishers/group-updated-publisher";
import { natsWrapper } from "../utils/nats-wrapper";

const router = Router();

const addMembersToGroupSchema = Joi.object({
  members: Joi.array().items(Joi.string()),
}).label("body");

router.put(
  "/",
  requireAuth,
  validate(addMembersToGroupSchema),
  async (req, res) => {
    if (!req.user) throw new BadRequestError("Invalid state!");

    const { members } = req.body;

    const exists = await Group.findById(req.group?.id);
    const user = mongoose.Types.ObjectId(req.user.id);

    if (!exists)
      throw new NotFoundError(`No groups exist with the id ${req.group?.id}`);

    if (await Group.exists({ _id: req.group?.id, members: { $nin: [user] } }))
      throw new BadRequestError("You are not a member of this group!");

    for (let memberId of members) {
      if (!(await User.exists({ _id: memberId })))
        throw new BadRequestError(`There is no user with id ${memberId}`);

      const member = mongoose.Types.ObjectId(memberId);

      if (await Group.exists({ _id: req.group?.id, members: { $in: [member] } }))
        throw new ResourceConflictError(`User ${memberId} is already in this group!`);
    }

    const memberIds = members.map(mongoose.Types.ObjectId);

    const raw = await Group.updateOne(
      {
        _id: req.group?.id,
      },
      { $push: { members: { $each: memberIds } } }
    );

    if (raw.n === 0)
      throw new BadRequestError('Something went wrong when adding members');

    const group = await Group.findById(req.group?.id).populate('members').populate('creator');

    await new GroupUpdatedPublisher(natsWrapper.client).publish({
      id: group!.id,
      members: members,
      type: GroupUpdateType.AddMember,
    });

    res.status(200).json(group);
  }
);

export { router as addMembersToGroupRouter };
