import {
  BadRequestError,
  NotFoundError,
  validate,
  requireAuth,
  GroupUpdateType,
  Action,
  Type
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import Group from "../models/group";
import mongoose from "mongoose";
import { GroupUpdatedPublisher } from "../publishers/group-updated-publisher";
import { ActivityPublisher } from '../publishers/activity-publisher';
import { natsWrapper } from "../utils/nats-wrapper";
import User from "../models/user";

const router = Router();

const editGroupInfoSchema = Joi.object()
  .keys({
    picture: Joi.string().allow(null),
    name: Joi.string().allow(null),
  })
  .or("picture", "name");

router.patch(
  "/",
  requireAuth,
  validate(editGroupInfoSchema),
  async (req, res) => {
    if (!req.user) throw new BadRequestError("Invalid state!");

    const { picture, name } = req.body;

    const group = await Group.findById(req.group?.id);

    const user = mongoose.Types.ObjectId(req.user.id);

    if (!group)
      throw new NotFoundError(`No groups exist with the id ${req.group?.id}`);

    if (await Group.exists({ _id: req.group?.id, members: { $nin: [user] } }))
      throw new BadRequestError("You are not a member of this group!");

    if (name) group.name = name;
    if (picture) group.picture = picture;


    await new GroupUpdatedPublisher(natsWrapper.client).publish({
      id: group!.id,
      picture,
      name,
      type: GroupUpdateType.EditInfo,
    });

    const usr = await User.findById(user);
    let involved: string[] = [];

    for (let member of group.members)
      involved.push(member.toHexString());

    await new ActivityPublisher(natsWrapper.client).publish({
      subject: { id: usr?.id, name: usr?.name!, type: Type.User },
      object: { id: group.id, name: group.name, type: Type.Group },
      parent: undefined,
      action: Action.Updated,
      involved: involved,
      data: undefined,
      request: { type: Type.Group, id: group?.id }
    });

    const gp = await Group.findById(req.group?.id)
      .populate("members")
      .populate("creator");

    res.status(200).json(gp);
  }
);

export { router as editGroupInfoRouter };
