import {
  BadRequestError,
  validate,
  requireAuth,
  Action,
  Type,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { IParticipant, PRole } from "../models/participant";
import {
  validatePriceFlow,
  validateParticipants,
} from "../utils/expense-validations";
import { Group } from "../models/group";
import { Payment } from "../models/payment";
import { User } from "../models/user";
import { ActivityPublisher } from "../publishers/activity-publisher";
import { natsWrapper } from "../utils/nats-wrapper";

const router = Router();

const schema = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
  amount: Joi.number().required().min(0),
  paid_at: Joi.number(),
  group: Joi.string(),
  notes: Joi.string(),
});

router.post("/", requireAuth, validate(schema), async (req, res) => {
  // a group that does not exist is not allowed
  if (req.body.group) {
    if (!(await Group.exists(req.body.group)))
      throw new BadRequestError("Group does not exists!");

    // check to make sure that all participants are in the group
    if (
      !(await Group.areMembersById(req.body.group, [
        req.body.from,
        req.body.to,
      ]))
    )
      throw new BadRequestError("pariticipant doesn't belong to this group!");
  }

  // users should exists as well
  if (!(await User.exists([req.body.from, req.body.to])))
    throw new BadRequestError("One of 'from' or 'to' doesn't exist!");

  const paymentid = await Payment.create({
    ...req.body,
    creator: req.user?.id,
  });

  const payment = await Payment.findById(paymentid);
  const involved: string[] = [payment.from.id, payment.to.id];

  await new ActivityPublisher(natsWrapper.client).publish({
    action: Action.Paid,
    request: {
      id: paymentid,
      type: Type.Payment,
    },
    subject: {
      id: payment.from.id,
      name: payment.from.name,
      type: Type.User,
    },
    object: {
      id: payment.to.id,
      name: payment.to.name,
      type: Type.User,
    },
    parent: {
      id: paymentid,
      name: "",
      type: Type.Payment,
    },
    involved: [payment.from.id, payment.to.id],,
  });

  res.status(201).json(payment);
});

export { router };
