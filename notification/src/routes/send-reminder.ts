import { NotFoundError, requireAuth, validate } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { ActivityListener } from "../listeners/activity-listener";
import User from "../models/user";
import { natsWrapper } from "../utils/nats-wrapper";
import { notification } from "../utils/notif-wrapper";

const router = Router();

const schema = Joi.object({
  message: Joi.string().required(),
  contact: Joi.string().required(),
});

router.post("/", requireAuth, validate(schema), async (req, res) => {
  const { contact } = req.body;
  const receiver = await User.findById(contact);
  if (!receiver) throw new NotFoundError("User does not exist!");

  await notification.send(req.body.message, receiver.token);

  res.status(204).send();
});

export { router };
