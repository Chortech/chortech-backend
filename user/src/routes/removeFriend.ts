import { BadRequestError, validate } from "@chortec/common";
import { Router } from "express";
import mongoose from "mongoose";
import Joi from "joi";
import { validateId } from "../utils/idValidator";

const router = Router();

router.delete("/", async (req, res) => {
  console.log("remove");
  res.json({ id: req.friend?.id });
});

export { router };
