import {
  BadRequestError,
  requireAuth,
  UnauthorizedError,
} from "@chortec/common";
import { Router } from "express";
import User from "../models/user";
import { fileManager } from "../utils/file-manager";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  if (!req.headers["content-type"])
    throw new BadRequestError("Content-Type must be set!");
  if (req.headers["content-type"]?.indexOf("image/") === -1)
    throw new BadRequestError("Content-Type must be an image type");

  if (!(await User.exists({ _id: req.user?.id })))
    throw new UnauthorizedError();

  const data = await fileManager.generateUploadURL(
    req.user!.id,
    req.headers["content-type"]
  );

  res.json(data);
});

export { router };
