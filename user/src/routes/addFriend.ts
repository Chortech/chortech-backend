import { BadRequestError, NotFoundError, requireAuth } from "@chortec/common";
import { Router } from "express";
import User from "../models/user";

const router = Router();

router.put("/", requireAuth, async (req, res) => {
  const user = await User.findById(req.user?.id);
  if (!user) throw new NotFoundError("User doesn't exists!");

  if (user.friends?.find((x) => x.id.toString() === req.friend?.id))
    throw new BadRequestError(`Already friends with user: ${req.friend?.id}`);

  const friend = await User.findById(req.friend?.id);
  if (!friend) throw new BadRequestError("User doesn't exist try inviting.");

  user.friends?.push(friend);

  await user.save();
  res.json({ message: "Friend added." });
});

export { router };
