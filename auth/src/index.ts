import { app } from "./app";
import mongoose from "mongoose";
import { natsWrapper } from "./nats-wrapper";
import { randomBytes } from "crypto";

async function start() {
  if (!process.env.EMAIL) throw new Error("EMAIL is not defined!");
  if (!process.env.EMAIL_PASS) throw new Error("EMAIL_PASS is not defined!");
  if (!process.env.MAIL_SERVICE)
    throw new Error("MAIL_SERVICE is not defined!");
  if (!process.env.LINE_NUMBER) throw new Error("LINE_NUMBER is not defined!");
  if (!process.env.SMS_SECRET) throw new Error("SMS_SECRET is not defined!");
  if (!process.env.SMS_API_KEY) throw new Error("SMS_API_KEY is not defined!");
  // if (!process.env.NATS_URL) throw new Error("NATS_URL is not defined!");
  // if (!process.env.NATS_CLUSTER_ID)
  //   throw new Error("NATS_CLUSTER_ID is not defined!");
  // if (!process.env.NATS_CLIENT_ID)
  //   throw new Error("NATS_CLIENT_ID is not defined!");

  const port = process.env.PORT || 3000;
  const mongoURI = process.env.MONGO_URL || "mongodb://localhost:27017/auth";
  const natsClusterId = process.env.NATS_CLUSTER_ID || "chortec";
  const natsClientId =
    process.env.NATS_CLUSTER_ID || randomBytes(4).toString("hex");
  const natsUrl = process.env.NATS_URL || "http://localhost:4222";

  try {
    await natsWrapper.connect(natsClusterId, natsClientId, natsUrl);
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (err) {
    console.log(err);
  }

  app.listen(port, () => console.log(`Server is listening on port ${port}`));
}

start();
