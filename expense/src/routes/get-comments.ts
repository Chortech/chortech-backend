import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { graph, Nodes, PRole } from "../utils/neo";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  const expenseid = req.params.id;

  if (!(await graph.exists(Nodes.Expense, expenseid)))
    throw new NotFoundError("Expenese doesn't exists!");

  const comments = await graph.getComments(expenseid);

  res.json(comments);
});

export { router };
