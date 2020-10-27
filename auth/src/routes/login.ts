import {
  BadRequestError,
  UnauthenticatedError,
  validate,
} from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import User from "../models/user";
import { Password } from "../utils/password";
import { generateToken } from "../utils/jwt";
const router = Router();

const loginpSchema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string()
    .regex(
      new RegExp(
        /(^(\+98|98|0|0098)9\d{9}$)|(^(\+\u0669\u0668|\u0669\u0668|\u0660|\u0660\u0660\u0669\u0668)\u0669[\u0660-\u0669]{9}$)|(^(\+\u06f9\u06f8|\u06f9\u06f8|\u06f0|\u06f0\u06f0\u06f9\u06f8)\u06f9[\u06f0-\u06f9]{9}$)/
      )
    )
    .message("Invalid phone number"),
  password: Joi.string().min(8).max(16).required(),
})
  .xor("email", "phone")
  .label("body");

router.post("/", validate(loginpSchema), async (req, res) => {
  const { email, phone, password } = req.body;

  const users = phone ? await User.find({ phone }) : await User.find({ email });

  if (users.length != 1) throw new UnauthenticatedError();

  const user = users[0];

  if (!(await Password.compare(password, user.password)))
    throw new UnauthenticatedError();

  const token = await generateToken(
    { email: email, phone: phone, id: user._id },
    phone ? phone : email
  );

  res.status(200).json({
    id: user._id,
    token,
  });
});

export { router };
