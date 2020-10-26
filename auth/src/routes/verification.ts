import { Router } from "express";
import Joi from "joi";
import { BadRequestError, NotFoundError, validate } from "@chortec/common";
import { generateCode, verifyCode, cancelCode } from "../utils/verification";
import { sendMail } from "../utils/mailer";
import pug from "pug";
import path from "path";
const router = Router();

const generateShema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string()
    .regex(
      new RegExp(
        /(^(\+98|98|0|0098)9\d{9}$)|(^(\+\u0669\u0668|\u0669\u0668|\u0660|\u0660\u0660\u0669\u0668)\u0669[\u0660-\u0669]{9}$)|(^(\+\u06f9\u06f8|\u06f9\u06f8|\u06f0|\u06f0\u06f0\u06f9\u06f8)\u06f9[\u06f0-\u06f9]{9}$)/
      )
    )
    .message("Invalid phone number"),
})
  .or("email", "phone")
  .label("body");

router.post("/generate", validate(generateShema), async (req, res) => {
  const { phone, email } = req.body;
  let code;
  if (phone) {
    // Send sms
    throw new NotFoundError("Phone not implemented");
  } else {
    code = await generateCode(email);
    const html = pug.renderFile(
      path.join(__dirname, "..", "..", "views", "verify-template.pug"),
      {
        code: code,
      }
    );
    await sendMail({
      subject: "Chortec Verification Code",
      to: email,
      // text: `Your activation code is ${code}.
      // Enjoy managing you expenses.`,
      html: html,
    });
    res
      .status(201)
      .json({ message: `Activation code has been sent to your email` });
  }
});

const verifyShema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string()
    .regex(
      new RegExp(
        /(^(\+98|98|0|0098)9\d{9}$)|(^(\+\u0669\u0668|\u0669\u0668|\u0660|\u0660\u0660\u0669\u0668)\u0669[\u0660-\u0669]{9}$)|(^(\+\u06f9\u06f8|\u06f9\u06f8|\u06f0|\u06f0\u06f0\u06f9\u06f8)\u06f9[\u06f0-\u06f9]{9}$)/
      )
    )
    .message("Invalid phone number"),
  code: Joi.string().min(6).max(6).required(),
})
  .or("email", "phone")
  .label("body");

router.post("/verify", validate(verifyShema), async (req, res) => {
  const { phone, email, code } = req.body;

  if (phone) {
    throw new NotFoundError("Phone not implemented");
  } else {
    if (!(await verifyCode(email, code)))
      throw new BadRequestError("Wrong code!");
    res.status(200).json({ message: "Activation was successful." });
  }
});

router.delete("/cancel", validate(generateShema), async (req, res) => {
  const { phone, email } = req.body;
  if (phone) {
    throw new NotFoundError("Phone not implemented");
  } else {
    if (!(await cancelCode(email))) throw new NotFoundError("Code not found!");

    res.status(202).json({ message: "Code was canceled successfully." });
  }
});

export { router };
