import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
  Action,
  Type,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { Expense } from "../models/expense";
import { Payment } from "../models/payment";
import { User } from "../models/user";
import { ActivityPublisher } from "../publishers/activity-publisher";
import { natsWrapper } from "../utils/nats-wrapper";
import { graph, Nodes } from "../utils/neo";

const router = Router({ mergeParams: true });

router.delete("/", requireAuth, async (req, res) => {
  const paymentid = req.params.id;
  const payment = await Payment.findById(paymentid);
  if (!payment) throw new NotFoundError("Didn't found payment with given id!");

  if (!(await Payment.remove(paymentid)))
    throw new BadRequestError("Something went wrong!");
  const involved: string[] = [payment.from.id, payment.to.id];
  const user = await User.findById(req.user!.id);

  await new ActivityPublisher(natsWrapper.client).publish({
    action: Action.Removed,
    request: {
      id: paymentid,
      type: Type.Payment,
    },
    subject: {
      id: user.id,
      name: user.name,
      type: Type.User,
    },
    object: {
      id: paymentid,
      name: "",
      type: Type.Payment,
    },
    involved,
  });

  res.json({ message: "Delete successful" });
});

export { router };
