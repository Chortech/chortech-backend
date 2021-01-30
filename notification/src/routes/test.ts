import { requireAuth, validate } from "@chortec/common";
import { Router } from "express";
import Joi from "joi";
import User from "../models/user";
import { notification } from "../utils/notif-wrapper";

const router = Router();

const schema = Joi.object({
  token: Joi.string().required(),
  message: Joi.string(),
});

router.post("/", validate(schema), async (req, res) => {
  const { token, message } = req.body.token;

  const result = await notification.admin.messaging().send({
    token,
    notification: {
      body: message
        ? message
        : "This is an FCM notification that displays an image!",
      title: "FCM Notification",
    },
    apns: {
      payload: {
        aps: {
          "mutable-content": 1,
        },
      },
      fcmOptions: {
        imageUrl:
          "https://chortech.s3.ir-thr-at1.arvanstorage.com/chortech.jpg",
      },
    },
    android: {
      notification: {
        imageUrl:
          "https://chortech.s3.ir-thr-at1.arvanstorage.com/chortech.jpg",
      },
    },
  });
  console.log(result);
});

export { router };
