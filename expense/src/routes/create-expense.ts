import { BadRequestError, validate, requireAuth } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { graph, PRole } from "../utils/neo";

const router = Router();

const schema = Joi.object({
  id: Joi.string().required(),
  description: Joi.string().required(),
  total: Joi.number().required(),
  paid_at: Joi.number(),
  participants: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      role: Joi.string().valid(PRole.Creditor, PRole.Debtor),
      amount: Joi.number(),
    })
  ),
  group: Joi.string(),
  notes: Joi.string(),
});

router.post("/", validate(schema), async (req, res) => {
  await graph.addExpense(req.body);

  res.status(201).json(req.body);
});

export { router };
