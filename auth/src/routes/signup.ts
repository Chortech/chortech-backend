import { Router } from "express";
import { ResourceConflictError } from "@chortec/common";
import { Password } from "../utils/password";
import { generateToken } from "../utils/jwt";
import User from "../models/user";
import { validate } from "@chortec/common";
import Joi from "joi";

const router = Router();

const signupSchema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string()
    .regex(
      new RegExp(
        /(^(\+98|98|0|0098)9\d{9}$)|(^(\+\u0669\u0668|\u0669\u0668|\u0660|\u0660\u0660\u0669\u0668)\u0669[\u0660-\u0669]{9}$)|(^(\+\u06f9\u06f8|\u06f9\u06f8|\u06f0|\u06f0\u06f0\u06f9\u06f8)\u06f9[\u06f0-\u06f9]{9}$)/
      )
    )
    .message("Invalid phone number"),
  name: Joi.string().min(6).max(255).alphanum().required(),
  password: Joi.string().min(8).max(16).required(),
})
  .or("email", "phone")
  .label("body");

router.post("/", validate(signupSchema), async (req, res) => {
  const { email, phone, name, password } = req.body;

  // Check to see if the user already exists or not
  const savedUser = await User.find({
    $or: [{ email: email }, { phone: phone }],
  });

  if (savedUser.length != 0) {
    throw new ResourceConflictError("User already exists!");
  }

  // hash the password
  const hash = await Password.hash(password);

  // save the user to database
  const user = User.build({
    email,
    phone,
    password: hash,
    name: name,
  });

  const { _id } = await user.save();

  const token = await generateToken({ id: _id, email, phone }, email || phone);

  return res.status(201).send({
    id: _id,
    name,
    token: token,
  });
});

export { router };
