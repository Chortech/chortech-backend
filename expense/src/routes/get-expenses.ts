import { BadRequestError, validate, requireAuth } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { graph, PRole } from "../utils/neo";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userid = req.user?.id;
  const expenses = await graph.getExpenses(userid!);

  res.json(expenses);
});

export { router };
