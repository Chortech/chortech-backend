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
import { Group } from "../models/group";
import { IParticipant, Participant, PRole } from "../models/participant";
import { User } from "../models/user";
import { ActivityPublisher } from "../publishers/activity-publisher";
import {
  validateParticipants,
  validatePriceFlow,
} from "../utils/expense-validations";
import { natsWrapper } from "../utils/nats-wrapper";
import { graph, Nodes } from "../utils/neo";

const router = Router({ mergeParams: true });

// no-group for removing group
const NO_GROUP = "no-group";
const schema = Joi.object({
  id: Joi.string(),
  description: Joi.string(),
  total: Joi.number(),
  paid_at: Joi.number(),
  participants: Joi.array()
    .items(
      Joi.object({
        id: Joi.string(),
        role: Joi.string().valid(PRole.Creditor, PRole.Debtor),
        amount: Joi.number()
          .max(Number.MAX_SAFE_INTEGER - 1)
          .min(0),
      })
    )
    .min(2),
  group: Joi.string(),
  notes: Joi.string(),
  category: Joi.number(),
});

router.put(
  "/",
  requireAuth,
  validate(schema),
  validateParticipants,
  validatePriceFlow,
  async (req, res) => {
    const expense = await Expense.findById(req.params.id);

    if (!expense)
      throw new NotFoundError("Expense with the given id doesn't exist!");

    const participants = new Map<string, IParticipant>();
    for (const p of expense.participants) {
      participants.set(p.id, p);
    }
    if (req.body.category) expense.category = req.body.category;
    if (req.body.description) expense.description = req.body.description;
    if (req.body.paid_at) expense.paid_at = req.body.paid_at;
    if (req.body.group) {
      if (req.body.group !== NO_GROUP) {
        // a group that does not exists is not allowed
        if (!(await Group.exists(req.body.group)))
          throw new BadRequestError("Group does not exists!");
        expense.group = req.body.group;
      } else await Expense.deleteExpenseGroup(expense.id);
    }
    if (req.body.notes) expense.notes = req.body.notes;

    if (req.body.total) {
      // total without particpants is not allowed
      if (!req.body.participants)
        throw new BadRequestError(
          "Can't update total without defining participants!"
        );
      expense.total = req.body.total;
    }

    // see if there is a change in participants
    let changed = false;
    if (req.body.participants) {
      if (req.body.participants.length === expense.participants.length) {
        for (let i = 0; i < req.body.participants.length; i++) {
          const p1 = req.body.participants[i];
          if (!participants.has(p1.id)) {
            changed = true;
            break;
          }
          const p2 = participants.get(p1.id);

          if (!Participant.equals(p1, p2!)) {
            changed = true;
            break;
          }
        }
      } else changed = true;
    }

    // check to see if new participants is part of the group or not
    if (
      expense.group &&
      !(await Group.areMembers(
        expense.group,
        changed ? req.body.participants : expense.participants
      ))
    ) {
      throw new BadRequestError(
        `One of the new participants is not a member of group ${req.body.group}`
      );
    }
    if (changed) {
      expense.participants = req.body.participants;
      await Expense.updateFull(expense);
    } else await Expense.updateInfo(expense);
    Set;
    // if (req.body.participants) newexpense.total = req.body.total;
    // await graph.removeExpense(newexpense.id);
    const newExepnes = await Expense.findById(expense.id);
    const newParticipates = newExepnes.participants as IParticipant[];
    const user = await User.findById(req.user!.id);
    await new ActivityPublisher(natsWrapper.client).publish({
      action: Action.Updated,
      request: {
        id: expense.id,
        type: Type.Expense,
      },
      subject: {
        id: user.id,
        name: user.name,
        type: Type.User,
      },
      object: {
        id: newExepnes.id,
        name: newExepnes.description,
        type: Type.Expense,
      },
      involved: newParticipates.map((x) => x.id),
    });
    res.json(newExepnes);
  }
);

export { router };
