import { BadRequestError, validate, requireAuth } from "@chortec/common";
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

  res.json(await Payment.findById(paymentid));
});

export { router };
