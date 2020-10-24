import { Router } from "express";
import { ResourceConflictError } from "@chortec/common";
import { Password } from "../utils/password";
import { generateToken } from "../utils/jwt";
import User from "../models/user";
import { validate, SchemaType } from "../validations/validationHandler";

const router = Router();
router.post("/", validate(SchemaType.SINGUP), async (req, res) => {
  const { email, phone, name, password } = req.body;

  // Check to see if the user already exists or not
  const savedUser = await User.find({
    $or: [{ email: email }, { phone: phone }],
  });

  if (savedUser.length != 0) {
    throw new ResourceConflictError("User already exists!");
  }

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

  const token = await generateToken({ id: _id, email, phone }, email || phone);

  return res.status(201).send({
    id: _id,
    name,
    token: token,
  });
});

export { router };
