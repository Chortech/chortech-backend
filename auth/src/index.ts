import { app } from "./app";
import mongoose from "mongoose";
import { natsWrapper } from "./utils/nats-wrapper";
import { randomBytes } from "crypto";
import { redisWrapper } from "./utils/redis-wrapper";
import { UserInvitedListener } from "./listeners/user-invited-listener";

async function start() {
  if (!process.env.EMAIL) throw new Error("EMAIL is not defined!");
  if (!process.env.EMAIL_PASS) throw new Error("EMAIL_PASS is not defined!");
  if (!process.env.MAIL_SERVICE)
    throw new Error("MAIL_SERVICE is not defined!");
  if (!process.env.LINE_NUMBER) throw new Error("LINE_NUMBER is not defined!");
  if (!process.env.SMS_SECRET) throw new Error("SMS_SECRET is not defined!");
  if (!process.env.SMS_API_KEY) throw new Error("SMS_API_KEY is not defined!");

  const port = process.env.PORT || 3000;
  const mongoURI = process.env.MONGO_URL || "mongodb://localhost:27017/auth";
  const natsClusterId = process.env.NATS_CLUSTER_ID || "chortec";
  const natsClientId =
    process.env.NATS_CLIENT_ID || randomBytes(4).toString("hex");
  const natsUrl = process.env.NATS_URL || "http://localhost:4222";

  const redisURL = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    redisWrapper.connect(redisURL);
  } catch (err) {
    console.log(err);
  }

  try {
    await natsWrapper.connect(natsClusterId, natsClientId, natsUrl);
    console.log("Connected to mongo!");
  } catch (err) {
    console.error(err);
  }

  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (err) {
    console.error(err);
  }

  new UserInvitedListener(natsWrapper.client).listen();

  app.listen(port, () => console.log(`Server is listening on port ${port}`));
}

start();
