import {
  BadRequestError,
  NotFoundError,
  requireAuth,
  validate,
  ValidationError,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { Group } from "../models/group";
import { Payment, IPayment } from "../models/payment";

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
  res.json(await Payment.findById(req.params.id));
});

export { router };
