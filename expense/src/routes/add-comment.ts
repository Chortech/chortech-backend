import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { graph, Nodes, PRole } from "../utils/neo";
import { v4 as uuid } from "uuid";
const router = Router({ mergeParams: true });

const scheme = Joi.object({
  text: Joi.string().max(255),
  created_at: Joi.number(),
});

router.post("/", requireAuth, validate(scheme), async (req, res) => {
  const expenseid = req.params.id;

  if (!(await graph.exists(Nodes.Expense, expenseid)))
    throw new NotFoundError("Expenese doesn't exists!");

  const n = await graph.addComment(expenseid, req.user?.id!, {
    id: uuid(),
    ...req.body,
  });

  if (!n || n === 0)
    throw new BadRequestError(
      `user ${req.user?.id} doesn't participate in expense ${expenseid}`
    );

  res.status(201).json({ message: "Comment added." });
});

export { router };
