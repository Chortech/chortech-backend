import { requireAuth, validate } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import User from "../models/user";

const router = Router();
const schema = Joi.object({
  token: Joi.string().required(),
});

router.post("/", requireAuth, validate(schema), async (req, res) => {
  let user = await User.findById(req.user?.id);

  if (user) {
    await User.updateOne({ _id: user.id }, { token: req.body.token });
    return res.status(204).send();
  }

  user = User.build({
    id: req.user!.id,
    token: req.body.token,
  });
  await user.save();

  return res.status(204).send();
});

export { router };
