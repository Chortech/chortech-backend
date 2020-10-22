import { Router } from "express";
import { SchemaType, validate } from "@chortec/common";
import { ResourceConflictError } from "@chortec/common";
import User from "../models/user";

const router = Router();

router.post("/", validate(SchemaType.SINGUP), async (req, res) => {
  const { email, phone, name, password } = req.body;

  const user = User.build({
    email,
    password,
    phone,
    name: name,
  });

  // Check to see if the user already exists or not
  const savedUser = await User.find({
    $or: [{ email: email }, { phone: phone }],
  });

  if (savedUser.length != 0) {
    throw new ResourceConflictError("User already exists!");
  }

  // TODO hash the password

  const { _id } = await user.save();

  return res.status(201).send({
    id: _id,
    name,
  });
});

export { router };
