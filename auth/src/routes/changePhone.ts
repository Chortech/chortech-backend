import {
  BadRequestError,
  validate,
  requireAuth,
  ResourceConflictError,
} from "@chortec/common";
import { isVerified } from "../utils/verification";
import { Router } from "express";
import Joi from "joi";
import User from "../models/user";

const router = Router();

const changePhoneSchema = Joi.object({
  newPhone: Joi.string()
    .regex(
      new RegExp(
        /(^(\+98|98|0|0098)9\d{9}$)|(^(\+\u0669\u0668|\u0669\u0668|\u0660|\u0660\u0660\u0669\u0668)\u0669[\u0660-\u0669]{9}$)|(^(\+\u06f9\u06f8|\u06f9\u06f8|\u06f0|\u06f0\u06f0\u06f9\u06f8)\u06f9[\u06f0-\u06f9]{9}$)/
      )
    )
    .message("Invalid phone number"),
});

router.put("/", requireAuth, validate(changePhoneSchema), async (req, res) => {
  if (!req.user) throw new BadRequestError("Invalid State!");

  const { newPhone } = req.body;
  const { id } = req.user;

  const user = await User.findById(id);

  if (!user) throw new BadRequestError("Invalid State!");

  const users = newPhone ? await User.find({ newPhone }) : [];

  if (users.length != 0)
    throw new ResourceConflictError("This phone has already been used!");

  if (!(await isVerified(newPhone)))
    throw new BadRequestError("Phone is not verified!");

  user.phone = newPhone;

  await user.save();

  res.status(200).send({
    message: "Phone changed successfully.",
  });
});

export { router as changePhoneRouter };
