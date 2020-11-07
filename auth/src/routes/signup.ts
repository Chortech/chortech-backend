import { Router } from "express";
import {
  BadRequestError,
  ResourceConflictError,
  validate,
} from "@chortec/common";
import { natsWrapper } from "../utils/nats-wrapper";
import { Password } from "../utils/password";
import { generateToken } from "../utils/jwt";
import User from "../models/user";
import Joi from "joi";
import { isVerified, removeVerified } from "../utils/verification";
import { UserCreatedPub } from "../publishers/user-publishers";
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
  .xor("email", "phone")
  .label("body");

router.post("/", validate(signupSchema), async (req, res) => {
  const { email, phone, name, password } = req.body;

  // Check to see if the user already exists or not
  const users = phone ? await User.find({ phone }) : await User.find({ email });

  if (users.length != 0) {
    throw new ResourceConflictError("User already exists!");
  }

  // Check for email or phone being verified
  if (phone) {
    if (!(await isVerified(phone)))
      throw new BadRequestError("Phone not verified!");

    removeVerified(phone);
  } else {
    if (!(await isVerified(email)))
      throw new BadRequestError("Email not verified!");

    removeVerified(email);
  }
  // const session = await mongoose.startSession();
  try {
    // session.startTransaction();

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

    const token = await generateToken(
      { id: _id, email, phone },
      email || phone
    );

    await new UserCreatedPub(natsWrapper.client).publish({
      id: user._id,
      name: name,
      email: email,
      phone: phone,
    });

    // await session.commitTransaction();
    // session.endSession();

    return res.status(201).send({
      id: _id,
      name,
      token: token,
    });
  } catch (err) {
    // await session.abortTransaction();
    // session.endSession();
    throw err;
  }
});

export { router };
