import { requireAuth, validate } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";

const router = Router();
const schema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string()
    .regex(
      new RegExp(
        /(^(\+98|98|0|0098)9\d{9}$)|(^(\+\u0669\u0668|\u0669\u0668|\u0660|\u0660\u0660\u0669\u0668)\u0669[\u0660-\u0669]{9}$)|(^(\+\u06f9\u06f8|\u06f9\u06f8|\u06f0|\u06f0\u06f0\u06f9\u06f8)\u06f9[\u06f0-\u06f9]{9}$)/
      )
    )
    .message("Invalid phone number"),
  name: Joi.string().min(6).max(255).alphanum().required(),
})
  .xor("email", "phone")
  .label("body");

router.post("/", requireAuth, validate(schema), async (req, res) => {

    res.json({})

});

export { router };
