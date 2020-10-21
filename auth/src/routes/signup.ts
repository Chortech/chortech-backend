import { Router } from "express";
import { SchemaType, validate } from "@chortec/common";
import mongoose from "mongoose";
import User from "../models/user";

const router = Router();

router.post("/", validate(SchemaType.USER), async (req, res) => {
  const { email, phone, name, password } = req.body;

  const user = User.build({
    email,
    password,
    phone,
    name,
  });

  // Check to see if the user already exists or not
  const option = email ? email : phone;

  const savedUser = User.findOne(option);
  if (savedUser) {
    throw new Error("User already exists!");
  }

  // TODO hash the password
  // TODO remove the try catch after implementing the error handler

  try {
    const { _id, name } = await user.save();
    return res.status(201).send({
      id: _id,
      name,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ message: err.message });
  }
});

export { router };
