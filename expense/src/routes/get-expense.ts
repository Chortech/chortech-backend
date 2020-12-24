import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { graph, PRole } from "../utils/neo";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  const expenseid = req.params.id;
  const expense = await graph.getExpense(expenseid);

  if (!expense) throw new NotFoundError("Didn't found expense with given id!");

  res.json(expense);
});

export { router };
