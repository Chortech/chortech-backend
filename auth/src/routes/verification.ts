import { Router } from "express";
import Joi from "joi";
import { BadRequestError, NotFoundError, validate } from "@chortec/common";
import {
  generateCode,
  verifyCode,
  cancelCode,
  generateCodeStage,
} from "../utils/verification";
import { sendMail } from "../utils/mailer";
import pug from "pug";
import path from "path";
import smsSender from "../utils/smsSender";
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
  .xor("email", "phone")
  .label("body");

router.post("/generate", validate(generateShema), async (req, res) => {
  const { phone, email } = req.body;
  let code;

  // for testing putposes define STAGE variable so
  // that a pre-defined code would be generated for
  // each phone or email so that testers don't need
  // to provide real email or phones. Keep in mind
  // that the variable only need to be defined and
  // the value doesn't matter at all.

  if (phone) {
    code = process.env.STAGE
      ? await generateCodeStage(phone)
      : await generateCode(phone);
    const message = `کد تایید چرتک:‌ ${code}`;
    if (!process.env.STAGE)
      smsSender.sendSMS(message, phone).catch(console.log);
  } else {
    code = code = process.env.STAGE
      ? await generateCodeStage(email)
      : await generateCode(email);
    const html = pug.renderFile(
      path.join(__dirname, "..", "..", "views", "verify-template.pug"),
      {
        code: code,
      }
    );
    if (!process.env.STAGE)
      sendMail({
        subject: "Chortec Verification Code",
        to: email,
        html: html,
      })
        .then(() => "mail sent")
        .catch((ex) => console.log(ex));
  }

  res.status(201).json({
    message: `Activation code has been sent to your ${
      phone ? "phone" : "email"
    }`,
  });
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
  .xor("email", "phone")
  .label("body");

router.post("/verify", validate(verifyShema), async (req, res) => {
  const { phone, email, code } = req.body;

  if (phone) {
    if (!(await verifyCode(phone, code)))
      throw new BadRequestError("Wrong code!");
    res.status(200).json({ message: "Activation was successful." });
  } else {
    if (!(await verifyCode(email, code)))
      throw new BadRequestError("Wrong code!");
    res.status(200).json({ message: "Activation was successful." });
  }
});

router.put("/cancel", validate(generateShema), async (req, res) => {
  const { phone, email } = req.body;
  if (phone) {
    if (!(await cancelCode(phone))) throw new NotFoundError("Code not found!");
  } else {
    if (!(await cancelCode(email))) throw new NotFoundError("Code not found!");
  }

  res.status(202).json({ message: "Code was canceled successfully." });
});

export { router };
