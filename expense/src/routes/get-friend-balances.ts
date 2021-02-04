import { requireAuth } from "@chortec/common";
import { Router } from "express";
import { query } from "../utils/query";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  const expenses = await query.findFriendBalances(req.user!.id, req.params.id);

  res.json(expenses);
});

export { router };
