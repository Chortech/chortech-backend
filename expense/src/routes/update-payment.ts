import {
  Action,
  BadRequestError,
  NotFoundError,
  requireAuth,
  Type,
  validate,
  ValidationError,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { Group } from "../models/group";
import { Payment, IPayment } from "../models/payment";
import { ActivityPublisher } from "../publishers/activity-publisher";
import { natsWrapper } from "../utils/nats-wrapper";

const router = Router({ mergeParams: true });

const NO_GROUP = "no-group";
const schema = Joi.object({
  amount: Joi.number().min(0),
  paid_at: Joi.number(),
  group: Joi.string(),
  notes: Joi.string(),
});

router.put("/", requireAuth, validate(schema), async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment)
    throw new NotFoundError("Payment with the given id doesn't exist!");

  if (req.body.group && req.body.group !== NO_GROUP) {
    if (!(await Group.exists(req.body.group)))
      throw new BadRequestError("Group does not exists!");
    if (
      !(await Group.areMembersById(req.body.group, [
        payment.to.id,
        payment.from.id,
      ]))
    )
      throw new BadRequestError(
        "One of if not both 'from' or 'to' don't exist in group!"
      );
  }
  await Payment.update({
    ...req.body,
    from: payment.from.id,
    to: payment.to.id,
    id: req.params.id,
  });

  const newPayment = await Payment.findById(req.params.id);
  const involved: string[] = [payment.from.id, payment.to.id];

  new ActivityPublisher(natsWrapper.client).publish({
    action: Action.Updated,
    request: {
      id: newPayment.id,
      type: Type.Payment,
    },
    subject: {
      id: newPayment.from.id,
      name: newPayment.from.name,
      type: Type.User,
    },
    object: {
      id: newPayment.to.id,
      name: newPayment.to.name,
      type: Type.User,
    },
    parent: {
      id: newPayment.id,
      name: "",
      type: Type.Payment,
    },
    involved,
  });

  res.json(newPayment);
});

export { router };
