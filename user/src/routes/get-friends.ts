import { NotFoundError, requireAuth } from "@chortec/common";
import { Router } from "express";
import User from "../models/user";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const user = await User.findById(req.user?.id).populate("friends");

  if (!user) throw new NotFoundError("User doesn't exists.");

  res.json(user.toJSON());
});

export { router };
