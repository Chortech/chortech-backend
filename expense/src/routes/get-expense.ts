import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { Expense } from "../models/expense";
import { graph } from "../utils/neo";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  const expenseid = req.params.id;
  const expense = await Expense.findById(expenseid);

  if (!expense) throw new NotFoundError("Didn't found expense with given id!");

  res.json(expense);
});

export { router };
