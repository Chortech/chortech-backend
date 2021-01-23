import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { Expense } from "../models/expense";
import { graph, Nodes } from "../utils/neo";

const router = Router({ mergeParams: true });

router.delete("/", requireAuth, async (req, res) => {
  const expenseid = req.params.id;

  if (!(await graph.exists(Nodes.Expense, expenseid)))
    throw new NotFoundError("Didn't found expense with given id!");

  if (!(await Expense.remove(expenseid)))
    throw new BadRequestError("Something went wrong!");

  res.json({ message: "Delete successful" });
});

export { router };
