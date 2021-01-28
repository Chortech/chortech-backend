import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { Comment } from "../models/comment";
import { Expense } from "../models/expense";
import { Nodes } from "../utils/neo";
const router = Router({ mergeParams: true });

const scheme = Joi.object({
  text: Joi.string().max(255).required(),
  created_at: Joi.number().required(),
});

router.post("/", requireAuth, validate(scheme), async (req, res) => {
  const expenseid = req.params.id;

  if (!(await Expense.exists(expenseid)))
    throw new NotFoundError("Expenese doesn't exists!");

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

  res.status(201).json({ message: "Comment added." });
});

export { router };
