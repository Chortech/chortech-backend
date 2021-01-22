import { BadRequestError, validate, requireAuth } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { graph } from "../utils/neo";
import { v4 as uuid } from "uuid";
import { Integer } from "neo4j-driver";
import { IParticipant, PRole } from "../models/participant";
import {
  validatePriceFlow,
  validateParticipants,
} from "../utils/expense-validations";
import { Expense } from "../models/expense";

const router = Router();

const schema = Joi.object({
  description: Joi.string().required(),
  total: Joi.number().required(),
  paid_at: Joi.number(),
  participants: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        role: Joi.string().valid(PRole.Creditor, PRole.Debtor).required(),
        amount: Joi.number().required(),
      })
    )
    .min(2),
  group: Joi.string(),
  notes: Joi.string(),
});

// const data = {
//   "description": "this is an expense",
//   "total": 10,
//   "paid_at": 1608673567,
//   "participants": [
//     {
//       "id": "",
//       "role": "",
//       "amount": 1,
//     },
//   ],
// };

router.post(
  "/",
  requireAuth,
  validate(schema),
  validateParticipants,
  validatePriceFlow,
  async (req, res) => {
    const id = await Expense.create({ ...req.body, creator: req.user?.id });
    const expense = await Expense.findById(id);
    res.status(201).json(expense);
  }
);

export { router };
