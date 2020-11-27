import { BadRequestError, validate, requireAuth } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";

const router = Router();

// const changePassSchema = Joi.object({
//   newpass: Joi.string().min(8).max(16).required(),
//   oldpass: Joi.string().min(8).max(16).required(),
// });

router.post("/", async (req, res) => {
  res.json({});
});

export { router };
