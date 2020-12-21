import {
  BadRequestError,
  NotFoundError,
  requireAuth,
  ResourceConflictError,
  validate,
} from "@chortec/common";
import { raw, Router } from "express";
import Joi from "joi";
import mongoose, { Schema, Types } from "mongoose";
import User from "../models/user";

const router = Router();

const addFriendScheme = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string()
    .regex(
      new RegExp(
        /(^(\+98|98|0|0098)9\d{9}$)|(^(\+\u0669\u0668|\u0669\u0668|\u0660|\u0660\u0660\u0669\u0668)\u0669[\u0660-\u0669]{9}$)|(^(\+\u06f9\u06f8|\u06f9\u06f8|\u06f0|\u06f0\u06f0\u06f9\u06f8)\u06f9[\u06f0-\u06f9]{9}$)/
      )
    )
    .message("Invalid phone number"),
})
  .xor("email", "phone")
  .label("body");

router.put("/", requireAuth, validate(addFriendScheme), async (req, res) => {
  const { email, phone } = req.body;

  // if (req.user?.id === req.friend?.id)
  //   throw new BadRequestError("Friend id and user id are the same!");

  // if (!(await User.exists({ _id: req.friend?.id })))
  //   throw new NotFoundError(`${req.friend?.id} is not an actual user!!!`);

  // find the user with the given email or phone
  // and add them to current friend's list by adding a new friend to it

  const friend = await User.findOne({
    $or: [
      { email: { $exists: true, $eq: email } },
      { phone: { $exists: true, $eq: phone } },
    ],
  });

  if (!friend)
    throw new NotFoundError("The user you're trying to add doesn't exist.");

  if (friend._id.equals(req.user?.id))
    throw new BadRequestError("You can't add your self as friend!");

  let id = mongoose.Types.ObjectId(friend._id);
  let raw = await User.updateOne(
    {
      _id: req.user?.id,
      friends: { $nin: [id] },
    },
    { $push: { friends: id } }
  );

  if (raw.n === 0)
    throw new ResourceConflictError(`${friend._id} is already your friend`);

  // if we are successful in adding a friend to user
  // then add user as friend to them.

  id = mongoose.Types.ObjectId(req.user?.id);
  raw = await User.updateOne(
    {
      _id: friend._id,
      friends: { $nin: [id] },
    },
    { $push: { friends: id } }
  );

  // this error shouldn't happen normally so if it happened
  // sth is wrong and need further investigation. The reson
  // is that if we're adding a freind and forcing the other
  // friend to add us so there shouldn't be a scenario in
  // which i added sb and he/she can't add me.

  if (raw.n === 0)
    throw new ResourceConflictError(
      `${req.user?.id} is already a friend of ${friend._id}`
    );

  // this is an extra step we don't need to pass the user
  // back to the caller so if we see performance hit here
  // better remove this and just notify the caller with a
  // message.

  const user = await User.findById(req.user?.id);
  res.status(200).json({ user });
});

export { router };
