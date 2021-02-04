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
import { Expense } from "../models/expense";
import { Group } from "../models/group";
import { ActivityPublisher } from "../publishers/activity-publisher";
import { natsWrapper } from "../utils/nats-wrapper";
import { User } from "../models/user";

const router = Router();

const schema = Joi.object({
  description: Joi.string().required(),
  total: Joi.number().required(),
  paid_at: Joi.number(),
  participants: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        role: Joi.string().valid(PRole.Creditor, PRole.Debtor).required(),
        amount: Joi.number()
          .required()
          .max(Number.MAX_SAFE_INTEGER - 1)
          .min(0),
      })
    )
    .min(2),
  group: Joi.string(),
  notes: Joi.string(),
  category: Joi.number().required(),
});

router.post(
  "/",
  requireAuth,
  validate(schema),
  validateParticipants,
  validatePriceFlow,
  async (req, res) => {
    // a group that does not exist is not allowed
    if (req.body.group) {
      if (!(await Group.exists(req.body.group)))
        throw new BadRequestError("Group does not exists!");

      // check to make sure that all participants are in the group
      if (!(await Group.areMembers(req.body.group, req.body.participants)))
        throw new BadRequestError("pariticipant doesn't belong to this group!");
    }

    const id = await Expense.create({ ...req.body, creator: req.user?.id });
    const expense = await Expense.findById(id);
    const participants: IParticipant[] = expense.particpants;
    const user = await User.findById(req.user!.id);
    await new ActivityPublisher(natsWrapper.client).publish({
      action: Action.Created,
      request: {
        id,
        type: Type.Expense,
      },
      subject: {
        id: user.id,
        name: user.name,
        type: Type.User,
      },
      object: {
        id,
        name: expense.description,
        type: Type.Expense,
      },
      involved: participants.map((x) => x.id),
    });

    res.status(201).json(expense);
  }
);

export { router };
