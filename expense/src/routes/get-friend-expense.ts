import { requireAuth } from "@chortec/common";
import { Router } from "express";
import { Expense } from "../models/expense";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  const expenses = await Expense.findAssociateExpensesByUserid(
    req.user!.id,
    req.params.id
  );

  res.json(expenses);
});

export { router };
