import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { Expense } from "../models/expense";
import { Group } from "../models/group";
import { IParticipant, Participant, PRole } from "../models/participant";
import {
  validateParticipants,
  validatePriceFlow,
} from "../utils/expense-validations";
import { graph, Nodes } from "../utils/neo";

const router = Router({ mergeParams: true });

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
    if (req.body.description) expense.description = req.body.description;
    if (req.body.paid_at) expense.paid_at = req.body.paid_at;
    if (req.body.group) {
      // a group that does not exists is not allowed
      if (!(await Group.exists(req.body.group)))
        throw new BadRequestError("Group does not exists!");
      expense.group = req.body.group;
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

    if (changed) {
      expense.participants = req.body.participants;
      await Expense.updateFull(expense);
    } else await Expense.updateInfo(expense);

    // if (req.body.participants) newexpense.total = req.body.total;
    // await graph.removeExpense(newexpense.id);
    res.json(changed);
  }
);

export { router };
