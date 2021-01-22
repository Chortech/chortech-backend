import { BadRequestError, validate, requireAuth } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { Expense } from "../models/expense";
import { graph } from "../utils/neo";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userid = req.user?.id;
  const expenses = await Expense.findByUserId(userid!);

  res.json(expenses ? expenses : []);
});

export { router };
