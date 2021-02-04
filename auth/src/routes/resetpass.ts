import {
  BadRequestError,
  requireAuth,
  ResourceConflictError,
  validate,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import User from "../models/user";
import { Password } from "../utils/password";
import { isVerified } from "../utils/verification";

const router = Router();

const resetPassSchema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string()
    .regex(
      new RegExp(
        /(^(\+98|98|0|0098)9\d{9}$)|(^(\+\u0669\u0668|\u0669\u0668|\u0660|\u0660\u0660\u0669\u0668)\u0669[\u0660-\u0669]{9}$)|(^(\+\u06f9\u06f8|\u06f9\u06f8|\u06f0|\u06f0\u06f0\u06f9\u06f8)\u06f9[\u06f0-\u06f9]{9}$)/
      )
    )
    .message("Invalid phone number"),
  newpass: Joi.string().min(8).max(16).required(),
})
  .xor("email", "phone")
  .label("body");

router.put("/", validate(resetPassSchema), async (req, res) => {
  const { newpass, email, phone } = req.body;

  // Check to see if the user already exists or not
  const users = phone ? await User.find({ phone }) : await User.find({ email });

  if (users.length != 1) {
    throw new BadRequestError("Wrong credentials!");
  }
  const user = users[0];

  // Check if the user verified phone or email
  if (!(await isVerified(phone ? phone : email)))
    throw new BadRequestError(`${phone ? "Phone" : "Email"} not verified!`);

  user.password = await Password.hash(newpass);

  await user.save();

  res.status(200).send({ message: "Password reset was successful" });
});

export { router };
