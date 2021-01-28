import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { Expense } from "../models/expense";
import { Payment } from "../models/payment";
import { graph, Nodes } from "../utils/neo";

const router = Router({ mergeParams: true });

router.delete("/", requireAuth, async (req, res) => {
  const paymentid = req.params.id;

  if (!(await Payment.exists(paymentid)))
    throw new NotFoundError("Didn't found payment with given id!");

  if (!(await Payment.remove(paymentid)))
    throw new BadRequestError("Something went wrong!");

  res.json({ message: "Delete successful" });
});

export { router };
