import Router from "express";
import {
  BadRequestError,
  requireAuth,
  NotFoundError,
  validate,
} from "@chortec/common";
import Group from "../models/group";
import Joi from "joi";
import mongoose from "mongoose";
import { GroupUpdatedPublisher } from "../publishers/group-updated-publisher";
import { natsWrapper } from "../utils/nats-wrapper";
import { GroupUpdateType } from "../../../common/src";

const router = Router();

const removeMemberSchema = Joi.object({
  member: Joi.string(),
}).label("body");

router.put("/", requireAuth, validate(removeMemberSchema), async (req, res) => {
  if (!req.user) throw new BadRequestError("Invalid state!");

  const { member } = req.body;

  const exists = await Group.exists({ _id: req.group?.id });
  const user = mongoose.Types.ObjectId(req.user.id);

  if (!exists)
    throw new NotFoundError(`No groups exist with the id ${req.group?.id}`);

  if (await Group.exists({ _id: req.group?.id, members: { $nin: [user] } }))
    throw new BadRequestError("You are not a member of this group!");

  if (await Group.exists({ _id: req.group?.id, creator: member }))
    throw new BadRequestError(
      "You cannot remove this user because they are the owner of the group!"
    );

  if (
    await Group.exists({
      _id: req.group?.id,
      inActiveExpenses: { $in: [user] },
    })
  )
    throw new BadRequestError(
      "You cannot remove this member because he participates in an active expense!"
    );

  const raw = await Group.updateOne(
    {
      _id: req.group?.id,
    },
    { $pull: { members: member } }
  );

  const group = await Group.findById(req.group?.id)
    .populate("members")
    .populate("creator");

  await new GroupUpdatedPublisher(natsWrapper.client).publish({
    id: group!.id,
    removed: member,
    type: GroupUpdateType.RemoveMember,
  });

  res.status(200).json({ group });
});

export { router as removeMemberRouter };
