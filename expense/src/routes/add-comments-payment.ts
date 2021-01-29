import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
  Type,
  Action,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { Comment } from "../models/comment";
import { Payment } from "../models/payment";
import { ActivityPublisher } from "../publishers/activity-publisher";
import { natsWrapper } from "../utils/nats-wrapper";
import { Nodes } from "../utils/neo";
const router = Router({ mergeParams: true });

const scheme = Joi.object({
  text: Joi.string().max(255).required(),
  created_at: Joi.number().required(),
});

router.post("/", requireAuth, validate(scheme), async (req, res) => {
  const paymentid = req.params.id;
  const payment = await Payment.findById(paymentid);
  if (!payment) throw new NotFoundError("Payment doesn't exists!");

  const n = await Comment.createWithOutParticipation(
    Nodes.Payment,
    paymentid,
    req.user?.id!,
    req.body
  );

  if (!n || n === 0)
    throw new BadRequestError(
      `user ${req.user?.id} doesn't participate in expense ${paymentid}`
    );

  const involved: string[] = [];
  if (payment.from.id !== req.user!.id) involved.push(payment.from.id);
  if (payment.to.id !== req.user!.id) involved.push(payment.to.id);

  new ActivityPublisher(natsWrapper.client).publish({
    action: Action.Commented,
    request: {
      id: paymentid,
      type: Type.Payment,
    },
    subject: {
      id: payment.from.id,
      name: payment.to.id,
      type: Type.User,
    },
    object: {
      id: payment.to.id,
      name: payment.to.id,
      type: Type.User,
    },
    parent: {
      id: paymentid,
      name: "",
      type: Type.Payment,
    },
    involved,
    data: req.body.text,
  });

  res.status(201).json({ message: "Comment added." });
});

export { router };
