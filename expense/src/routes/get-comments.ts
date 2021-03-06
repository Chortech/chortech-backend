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
import { graph, Nodes } from "../utils/neo";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  const expenseid = req.params.id;

  if (!(await Expense.exists(expenseid)))
    throw new NotFoundError("Expenese doesn't exists!");

  const comments = await Comment.findByTargetId(Nodes.Expense, expenseid);

  res.json(comments);
});

export { router };
