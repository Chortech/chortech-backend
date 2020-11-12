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
import { redisWrapper } from "../utils/redis-wrapper";
const router = Router();

// const signupSchema = Joi.object({
//   email: Joi.string().email(),
//   phone: Joi.string()
//     .regex(
//       new RegExp(
//         /(^(\+98|98|0|0098)9\d{9}$)|(^(\+\u0669\u0668|\u0669\u0668|\u0660|\u0660\u0660\u0669\u0668)\u0669[\u0660-\u0669]{9}$)|(^(\+\u06f9\u06f8|\u06f9\u06f8|\u06f0|\u06f0\u06f0\u06f9\u06f8)\u06f9[\u06f0-\u06f9]{9}$)/
//       )
//     )
//     .message("Invalid phone number"),
//   name: Joi.string().min(6).max(255).alphanum().required(),
//   password: Joi.string().min(8).max(16).required(),
// })
//   .xor("email", "phone")
//   .label("body");

router.get("/:id", async (req, res) => {
  const id = Buffer.from(req.params.id, "base64").toString("utf-8");
  console.log(id);
  const user = await redisWrapper.getAsync(id);
  res.render("signup", { id: id });
});

export { router };
