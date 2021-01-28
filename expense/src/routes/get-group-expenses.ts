import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { Router } from "express";
import { Group } from "../models/group";
import { query } from "../utils/query";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  if (!(await Group.areMembersById(req.params.id, [req.user!.id])))
    throw new BadRequestError("user doesn't belong to this group!");

  const expenses = await query.findGroupExpenses(req.user!.id, req.params.id);

  res.json(expenses);
});

export { router };
