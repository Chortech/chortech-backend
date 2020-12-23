import { BadRequestError, validate, requireAuth } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { graph, PRole } from "../utils/neo";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  const expenseid = req.params.id;
  const expense = await graph.getExpense(expenseid);

  res.json(expense);
});

export { router };
