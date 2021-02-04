import { requireAuth, validate } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import { ActivityListener } from "../listeners/activity-listener";
import User from "../models/user";
import { natsWrapper } from "../utils/nats-wrapper";
import { notification } from "../utils/notif-wrapper";

const router = Router();

// const schema = Joi.object({
//   token: Joi.string().required(),
//   message: Joi.string(),
// });

router.post("/", async (req, res) => {
  //   const { data } = req.body;

  await new ActivityListener(natsWrapper.client).send(req.body);

  res.status(204).send();
});

export { router };
