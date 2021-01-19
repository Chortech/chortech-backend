import Router from "express";
import {
  BadRequestError,
  ResourceConflictError,
  requireAuth,
} from "@chortec/common";
import { validate } from "@chortec/common";
import Joi from "joi";
import Group from "../models/group";
import mongoose from "mongoose";
import { GroupCreatedPublisher } from "../publishers/group-created-publisher";
import { natsWrapper } from "../utils/nats-wrapper";

const router = Router();

const createGroupSchema = Joi.object({
  name: Joi.string(),
  picture: Joi.string().allow(null),
}).label("body");

router.post("/", requireAuth, validate(createGroupSchema), async (req, res) => {
  if (!req.user) throw new BadRequestError("Invalid state!");

  const { name, picture } = req.body;

  const creator = mongoose.Types.ObjectId(req.user.id);

  const members = [creator];

  const inActiveExpenses: mongoose.Types.ObjectId[] = [];

  const group = Group.build({
    name,
    creator,
    members,
    inActiveExpenses,
    picture,
  });

  const gp = await group.save();

  await new GroupCreatedPublisher(natsWrapper.client).publish({
    id: gp.id,
    creator: gp.creator.toHexString(),
    name: gp.name,
    picture: gp.picture,
  });

  res.status(201).send({
    id: gp._id,
    name,
    creator,
  });
});

export { router as createGroupRouter };
