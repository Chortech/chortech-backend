import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { Router } from "express";
import { Expense } from "../models/expense";
import { graph } from "../utils/neo";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  const expenses = await Expense.findAssociatesByUserid(req.user!.id);

  res.json(expenses);
});

export { router };
