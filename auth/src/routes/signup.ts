import { Router } from "express";
import {
  BadRequestError,
  NotFoundError,
  ResourceConflictError,
  validate,
} from "@chortec/common";
import { natsWrapper } from "../utils/nats-wrapper";
import { Password } from "../utils/password";
import { generateToken } from "../utils/jwt";
import User from "../models/user";
import Joi from "joi";
import { isVerified, removeVerified } from "../utils/verification";
import {
  UserCreatedPub,
  InviteeCreatedPub,
} from "../publishers/user-publishers";
import { redisWrapper } from "../utils/redis-wrapper";
import { Invite } from "../listeners/user-invited-listener";
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
  name: Joi.string().min(3).max(255).required(),
  password: Joi.string().min(8).max(16).required(),
  id: Joi.string().uuid({ version: "uuidv4" }).optional(),
})
  .xor("email", "phone")
  .label("body");

router.post("/", validate(signupSchema), async (req, res) => {
  const { email, phone, name, password, id: uuid } = req.body;

  // Check to see if the user already exists or not
  const exists = await User.exists({
    $or: [
      { email: { $exists: true, $eq: email } },
      { phone: { $exists: true, $eq: phone } },
    ],
  });

  if (exists) {
    throw new ResourceConflictError("User already exists!");
  }

  // Check for email or phone being verified if not an invited user then don't need for any verification
  let invite: Invite;
  if (uuid) {
    const data = await redisWrapper.getAsync(uuid);
    if (!data)
      throw new NotFoundError("Invitiation expired or doesn't exists!");

    invite = JSON.parse(data);
  } else if (phone) {
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

    // await session.commitTransaction();
    // session.endSession();

    if (uuid) {
      await new InviteeCreatedPub(natsWrapper.client).publish({
        inviter: invite!.inviter,
        invitee: {
          id: _id,
          email,
          phone,
          name,
        },
      });
      await redisWrapper.delAsync(uuid);
      const key = invite!.invitee.phone || (invite!.invitee.email as string);
      await redisWrapper.delAsync(key);
      return res.send("<h1>successful</h1>");
    } else {
      // check if there's an invited link for user and remove it
      // because he/she decided to signup without the invite link
      const key = phone || (email as string);
      const uid = await redisWrapper.getAsync(key);
      if (uid) {
        await redisWrapper.delAsync(uid!);
        await redisWrapper.delAsync(key);
      }

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

      return res.status(201).send({
        id: _id,
        name,
        token: token,
      });
    }
  } catch (err) {
    // await session.abortTransaction();
    // session.endSession();
    throw err;
  }
});

export { router };
