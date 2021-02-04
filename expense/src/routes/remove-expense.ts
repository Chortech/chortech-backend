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
import { IParticipant } from "../models/participant";
import { User } from "../models/user";
import { ActivityPublisher } from "../publishers/activity-publisher";
import { natsWrapper } from "../utils/nats-wrapper";
import { graph, Nodes } from "../utils/neo";

const router = Router({ mergeParams: true });

router.delete("/", requireAuth, async (req, res) => {
  const expenseid = req.params.id;
  const expense = await Expense.findById(expenseid);
  if (!expense) throw new NotFoundError("Didn't found expense with given id!");

  if (!(await Expense.remove(expenseid)))
    throw new BadRequestError("Something went wrong!");
  const participants: IParticipant[] = expense.participants;
  const user = await User.findById(req.user!.id);
  await new ActivityPublisher(natsWrapper.client).publish({
    action: Action.Deleted,
    request: {
      id: expenseid,
      type: Type.Expense,
    },
    subject: {
      id: user.id,
      name: user.name,
      type: Type.User,
    },
    object: {
      id: expenseid,
      name: expense.description,
      type: Type.Expense,
    },
    involved: participants.map((x) => x.id),
  });

  res.json({ message: "Delete successful" });
});

export { router };
