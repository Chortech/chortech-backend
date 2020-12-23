import { BadRequestError, validate, requireAuth } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { graph, PRole } from "../utils/neo";
import { v4 as uuid } from "uuid";
const router = Router({ mergeParams: true });

const scheme = Joi.object({
  text: Joi.string().max(255),
  created_at: Joi.number(),
});

router.post("/", requireAuth, validate(scheme), async (req, res) => {
  const expenseid = req.params.id;

  const n = await graph.addComment(expenseid, req.user?.id!, {
    id: uuid(),
    ...req.body,
  });

  if (n === 0)
    throw new BadRequestError(
      `user ${req.user?.id} doesn't participate in expense ${expenseid}`
    );

  res.json({ message: "Comment added." });
});

export { router };
