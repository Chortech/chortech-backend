import { BadRequestError, requireAuth } from "@chortec/common";
import { Router } from "express";
import { Group } from "../models/group";
import { query } from "../utils/query";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  const expenses = await query.findAllGroupsBalances(req.user!.id);

  res.json(expenses);
});

export { router };
