import { BadRequestError, NotFoundError, requireAuth } from "@chortec/common";
import { Router } from "express";
import mongoose from "mongoose";
import User from "../models/user";

const router = Router();

router.delete("/", requireAuth, async (req, res) => {
  if (req.user?.id === req.friend?.id)
    throw new BadRequestError("User id and friend id can't be the same!");

  const raw = await User.updateOne(
    {
      $and: [
        { _id: req.user?.id },
        { friends: { $in: [new mongoose.Types.ObjectId(req.friend?.id)] } },
      ],
    },
    { $pullAll: { friends: [new mongoose.Types.ObjectId(req.friend?.id)] } }
  );

  // console.log(raw);

  if (raw.nModified === 0)
    throw new NotFoundError(`${req.friend?.id} is not your friend!`);

  const user = await User.findById(req.user?.id);

  res.status(200).json({ user });
});

export { router };