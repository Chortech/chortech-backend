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
import { Comment } from "../models/comment";
import { Expense } from "../models/expense";
import { IParticipant } from "../models/participant";
import { User } from "../models/user";
import { ActivityPublisher } from "../publishers/activity-publisher";
import { natsWrapper } from "../utils/nats-wrapper";
import { Nodes } from "../utils/neo";
const router = Router({ mergeParams: true });

const scheme = Joi.object({
  text: Joi.string().max(255).required(),
  created_at: Joi.number().required(),
});

router.post("/", requireAuth, validate(scheme), async (req, res) => {
  const expenseid = req.params.id;
  const expense = await Expense.findById(expenseid);
  if (!expense) throw new NotFoundError("Expenese doesn't exists!");

  const n = await Comment.create(
    Nodes.Expense,
    expenseid,
    req.user?.id!,
    req.body
  );

  if (!n || n === 0)
    throw new BadRequestError(
      `user ${req.user?.id} doesn't participate in expense ${expenseid}`
    );
  const user = await User.findById(req.user!.id);
  const participants = expense.participants as IParticipant[];
  new ActivityPublisher(natsWrapper.client).publish({
    action: Action.Commented,
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
    data: req.body.text,
  });

  res.status(201).json({ message: "Comment added." });
});

export { router };
