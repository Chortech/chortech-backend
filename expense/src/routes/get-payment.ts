import {
  BadRequestError,
  validate,
  requireAuth,
  NotFoundError,
} from "@chortec/common";
import { Router } from "express";
import { Payment } from "../models/payment";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  const paymentid = req.params.id;
  const expense = await Payment.findById(paymentid);

  if (!expense) throw new NotFoundError("Didn't found payment with given id!");

  res.json(expense);
});

export { router };
