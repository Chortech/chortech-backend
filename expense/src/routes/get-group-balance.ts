import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { Router } from "express";
import { Expense } from "../models/expense";
import { Group } from "../models/group";
import { graph } from "../utils/neo";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  if (!(await Group.areMembersById(req.params.id, [req.user!.id])))
    throw new BadRequestError("user doesn't belong to this group!");

  const expenses = await Expense.findGroupBalanceByGroupid(req.params.id);

  res.json(expenses);
});

export { router };
