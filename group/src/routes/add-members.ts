import Router from "express";
import {
  BadRequestError,
  ResourceConflictError,
  requireAuth,
  NotFoundError,
  Action,
  IData,
  Type
} from "@chortec/common";
import { validate, GroupUpdateType } from "@chortec/common";
import Joi from "joi";
import Group from "../models/group";
import User from "../models/user";
import mongoose from "mongoose";
import { GroupUpdatedPublisher } from "../publishers/group-updated-publisher";
import { ActivityPublisher } from '../publishers/activity-publisher';
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

    if (!members)
      throw new BadRequestError('There are no members to add!');

    const exists = await Group.exists({ _id: req.group?.id });
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

    const gp = await Group.findById(req.group?.id);

    await new GroupUpdatedPublisher(natsWrapper.client).publish({
      id: gp!.id,
      members: members,
      type: GroupUpdateType.AddMember,
    });

    const usr = await User.findById(user);
    let involved: string[] = [];

    for (let member of gp?.members!)
      involved.push(member.toHexString());

    let data: IData[] = [];

    for (let member of members) {
      const added = await User.findById(member);
      const activity: IData = {
        subject: { id: usr?.id, name: usr?.name!, type: Type.User },
        object: { id: added?.id, name: added?.name!, type: Type.User },
        parent: { id: gp?.id, name: gp?.name!, type: Type.Group },
        action: Action.Added,
        involved: involved,
        data: undefined,
        request: { type: Type.Group, id: gp?.id }
      }

      data.push(activity);
    }

    await new ActivityPublisher(natsWrapper.client).publish(data);

    const group = await Group.findById(req.group?.id).populate('members').populate('creator');

    res.status(200).json(group);
  }
);

export { router as addMembersToGroupRouter };
