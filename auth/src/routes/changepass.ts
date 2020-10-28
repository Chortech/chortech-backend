import { BadRequestError, validate, requireAuth } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import User from "../models/user";
import { Password } from "../utils/password";

const router = Router();

const changePassSchema = Joi.object({
  newpass: Joi.string().min(8).max(16).required(),
  oldpass: Joi.string().min(8).max(16).required(),
});

router.put("/", requireAuth, validate(changePassSchema), async (req, res) => {
  if (!req.user) throw new BadRequestError("Invalid state!");

  const { newpass, oldpass } = req.body;
  const { id } = req.user;
  // Check to see if the user already exists or not
  const user = await User.findById(id);

  if (!user) {
    throw new BadRequestError("Invalid state!");
  }

  if (!(await Password.compare(oldpass, user.password)))
    throw new BadRequestError("Old password is wrong!");

  user.password = await Password.hash(newpass);

  await user.save();

  res.status(200).send({ message: "Password was changed successfully" });
});

export { router };
