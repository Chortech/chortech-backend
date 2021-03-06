import { app } from "./app";
import mongoose from "mongoose";
import { natsWrapper } from "./utils/nats-wrapper";
import { randomBytes } from "crypto";
import { redisWrapper } from "./utils/redis-wrapper";
import { UserInvitedListener } from "./listeners/user-invited-listener";
import smsSender from "./utils/smsSender";
import fs from "fs";
import path from "path";

async function start() {
  // make sure you have a folder named secrets in rootdir of the
  // project and inside that folder there should be a file called
  // user-service-secrets.ts with the secrets required for this service.

  const secpath =
    process.env.SECRETS ||
    path.join(__dirname, "..", "..", "secrets", "auth-service-secrets.json");
  const secrets = JSON.parse(fs.readFileSync(secpath, "utf-8"));
  process.env.EMAIL = secrets.EMAIL;
  process.env.EMAIL_PASS = secrets.EMAIL_PASS;
  process.env.MAIL_SERVICE = secrets.MAIL_SERVICE;
  process.env.LINE_NUMBER = secrets.LINE_NUMBER;
  process.env.SMS_SECRET = secrets.SMS_SECRET;
  process.env.SMS_API_KEY = secrets.SMS_API_KEY;
  process.env.JWT_PRIVATE_KEY = secrets.JWT_KEY;

  if (!process.env.EMAIL) throw new Error("EMAIL is not defined!");
  if (!process.env.EMAIL_PASS) throw new Error("EMAIL_PASS is not defined!");
  if (!process.env.MAIL_SERVICE)
    throw new Error("MAIL_SERVICE is not defined!");
  if (!process.env.LINE_NUMBER) throw new Error("LINE_NUMBER is not defined!");
  if (!process.env.SMS_SECRET) throw new Error("SMS_SECRET is not defined!");
  if (!process.env.SMS_API_KEY) throw new Error("SMS_API_KEY is not defined!");
  if (!process.env.JWT_PRIVATE_KEY)
    throw new Error("JWT_PRIVATE_KEY is not defined!");

  const port = process.env.PORT || 3000;
  const mongoURI = process.env.MONGO_URL || "mongodb://localhost:27017/auth";
  const natsClusterId = process.env.NATS_CLUSTER_ID || "chortec";
  const natsClientId =
    process.env.NATS_CLIENT_ID || randomBytes(4).toString("hex");
  const natsUrl = process.env.NATS_URL || "http://localhost:4222";

  const redisURL = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    await smsSender.init();
  } catch (err) {
    console.log(err);
  }

  try {
    redisWrapper.connect(redisURL);
  } catch (err) {
    console.log(err);
  }

  try {
    await natsWrapper.connect(natsClusterId, natsClientId, natsUrl);
    new UserInvitedListener(natsWrapper.client).listen();
  } catch (err) {
    console.error(err);
  }

  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to mongo!");
  } catch (err) {
    console.error(err);
  }

  app.listen(port, () =>
    console.log(`\x1b[32mServer is listening on port ${port}\x1b[0m`)
  );
}

start();
