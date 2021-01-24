import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { Router } from "express";
import { Expense } from "../models/expense";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  const expenses = await Expense.findGroupsExpense(req.user!.id);

  res.json(expenses);
});

export { router };
