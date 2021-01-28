import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { Comment } from "../models/comment";
import { Payment } from "../models/payment";
import { Nodes } from "../utils/neo";
const router = Router({ mergeParams: true });

const scheme = Joi.object({
  text: Joi.string().max(255).required(),
  created_at: Joi.number().required(),
});

router.post("/", requireAuth, validate(scheme), async (req, res) => {
  const paymentid = req.params.id;

  if (!(await Payment.exists(paymentid)))
    throw new NotFoundError("Payment doesn't exists!");

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

  res.status(201).json({ message: "Comment added." });
});

export { router };
