import { BadRequestError, NotFoundError, requireAuth } from "@chortec/common";
import { raw, Router } from "express";
import mongoose, { Schema, Types } from "mongoose";
import User from "../models/user";

const router = Router();

router.put("/", requireAuth, async (req, res) => {
  if (req.user?.id === req.friend?.id)
    throw new BadRequestError("Friend id and user id are the same!");

  const raw = await User.updateOne(
    {
      _id: req.user?.id,
      friends: { $nin: [mongoose.Types.ObjectId(req.friend?.id)] },
    },
    { $push: { friends: new mongoose.Types.ObjectId(req.friend?.id) } }
  );
  // console.log(raw);
  if (raw.n === 0)
    throw new BadRequestError(`${req.friend?.id} is already your friend`);

  const user = await User.findById(req.user?.id);

  res.status(200).json({ user });
});

export { router };
