import { requireAuth, validate } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import User from "../models/user";
import { UserInvitedPublisher } from "../publishers/user-invited-publisher";
import { natsWrapper } from "../utils/nats-wrapper";

const router = Router();
const schema = Joi.object({
  invitees: Joi.array().items(
    Joi.object({
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
  ),
})
  .xor("email", "phone")
  .label("body");

router.post("/", requireAuth, validate(schema), async (req, res) => {
  const user = await User.findById(req.friend?.id).populate("friends");
  if (!user) throw new Error("Shouldn't reach here");

  const phoneUsers = [];
  const emailUsers = [];

  for (const invitee of req.body.invitees) {
    if (invitee.phone) phoneUsers.push(invitee);
    else if (invitee.email) emailUsers.push(invitee);
  }

  console.log(phoneUsers);
  console.log(emailUsers);

  User.find({
    $or: [
      { email: { $exists: true, $in: emailUsers } },
      { phone: { $exists: true, $in: phoneUsers } },
    ],
  });

  await new UserInvitedPublisher(natsWrapper.client).publish({
    Inviter: {
      id: req.user?.id!,
      email: req.user?.email,
      phone: req.user?.phone,
      name: user.name,
    },
    Invitees: req.body.invitees,
  });

  res.json({ message: "Invite sent." });
});

export { router };
