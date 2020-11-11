import { app } from "./app";
import mongoose from "mongoose";
import { natsWrapper } from "./utils/nats-wrapper";
import { randomBytes } from "crypto";
import { UserCreatedListener } from "./listeners/user-created-listener";

async function start() {
  const port = process.env.PORT || 3000;
  const mongoURI = process.env.MONGO_URL || "mongodb://localhost:27017/user";

  const natsClusterId = process.env.NATS_CLUSTER_ID || "chortec";
  const natsClientId =
    process.env.NATS_CLIENT_ID || randomBytes(4).toString("hex");
  const natsUrl = process.env.NATS_URL || "http://localhost:4222";
  try {
    await natsWrapper.connect(natsClusterId, natsClientId, natsUrl);
    new UserCreatedListener(natsWrapper.client).listen();
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

  app.listen(port, () => console.log(`Server is listening on port ${port}`));
}

start();
