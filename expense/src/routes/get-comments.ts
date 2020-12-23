import { BadRequestError, validate, requireAuth } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { graph, PRole } from "../utils/neo";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  const expenseid = req.params.id;
  const comments = await graph.getComments(expenseid);

  res.json(comments);
});

export { router };
