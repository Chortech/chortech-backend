import { BadRequestError, validate, requireAuth } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { graph, PRole, Participant } from "../utils/neo";
import { v4 as uuid } from "uuid";
import { Integer } from "neo4j-driver";

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

router.post("/", requireAuth, validate(schema), async (req, res) => {
  // checks the id of participants inside p with the users
  // of database and if there is a conflict it will stop
  // the operation.

  const participants: Participant[] = req.body.participants;
  const count = await graph.countParticipants(participants);

  if (participants.length != count)
    throw new BadRequestError("One of the participants doesn't exits!");

  const id = await graph.addExpense({ ...req.body, creator: req.user?.id });
  const expense = await graph.getExpense(id);
  res.status(201).json(expense);
});

export { router };
