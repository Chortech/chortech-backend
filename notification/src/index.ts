import { app } from "./app";
import { natsWrapper } from "./utils/nats-wrapper";
import { randomBytes } from "crypto";
import path from "path";
import fs from "fs";
import { notification } from "./utils/notif-wrapper";
import { ActivityListener } from "./listeners/activity-listener";
import mongoose from "mongoose";
import { UserCreatedListener } from "./listeners/user-created-listener";

async function start() {
  const secpath =
    process.env.SECRETS ||
    path.join(
      __dirname,
      "..",
      "..",
      "secrets",
      "notification-services-secrets.json"
    );

  // Initialize Firebase wrapper
  notification.init(secpath);

  const port = process.env.PORT || 3000;
  const natsClusterId = process.env.NATS_CLUSTER_ID || "chortec";
  const natsClientId =
    process.env.NATS_CLIENT_ID || randomBytes(4).toString("hex");
  const natsUrl = process.env.NATS_URL || "http://localhost:4222";
  try {
    await natsWrapper.connect(natsClusterId, natsClientId, natsUrl);
    new ActivityListener(natsWrapper.client).listen();
    new UserCreatedListener(natsWrapper.client).listen();
  } catch (err) {
    console.error(err);
  }
  const mongoURI = process.env.MONGO_URL || "mongodb://localhost:27017/user";
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
