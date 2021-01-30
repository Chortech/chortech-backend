import { app } from "./app";
import mongoose from "mongoose";
import { natsWrapper } from "./utils/nats-wrapper";
import { UserCreatedListener } from './listeners/user-created-listener';
import { UserUpdatedListener } from './listeners/user-updated-listener';
import { fileManager } from './utils/file-manager';
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";


async function start() {

    const secpath =
    process.env.SECRETS ||
    path.join(__dirname, "..", "..", "secrets", "group-service-secrets.json");

    const secrets = JSON.parse(fs.readFileSync(secpath, "utf-8"));
    process.env.STORAGE_REGION = secrets.STORAGE_REGION;
    process.env.STORAGE_ENDPOINT = secrets.STORAGE_ENDPOINT;
    process.env.STORAGE_ACCESSKEYID = secrets.STORAGE_ACCESSKEYID;
    process.env.STORAGE_SECRET = secrets.STORAGE_SECRET;
    process.env.STORAGE_BUCKET = secrets.STORAGE_BUCKET;

    if (!process.env.STORAGE_REGION)
        throw new Error("STORAGE_REGION must be defined!");
    if (!process.env.STORAGE_ENDPOINT)
        throw new Error("STORAGE_ENDPOINT must be defined!");
    if (!process.env.STORAGE_ACCESSKEYID)
        throw new Error("STORAGE_ACCESSKEYID must be defined!");
    if (!process.env.STORAGE_SECRET)
        throw new Error("STORAGE_SECRET must be defined!");
    if (!process.env.STORAGE_BUCKET)
        throw new Error("STORAGE_BUCKET must be defined!");

    const port = process.env.PORT || 3000;
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/group';
    const natsClusterId = process.env.NATS_CLUSTER_ID || "chortec";
    const natsClientId =
        process.env.NATS_CLIENT_ID || randomBytes(4).toString("hex");
    const natsUrl = process.env.NATS_URL || "http://localhost:4222";

    try {
        fileManager.init({
          S3: {
            region: process.env.STORAGE_REGION!,
            endpoint: process.env.STORAGE_ENDPOINT!,
            credentials: {
              accessKeyId: process.env.STORAGE_ACCESSKEYID!,
              secretAccessKey: process.env.STORAGE_SECRET!,
            },
          },
          urlExpire: 60 * 60,
          bucket: process.env.STORAGE_BUCKET!,
        });
      } catch (err) {
        console.log(err);
      }

    try {
        await natsWrapper.connect(natsClusterId, natsClientId, natsUrl);
        new UserCreatedListener(natsWrapper.client).listen();
        new UserUpdatedListener(natsWrapper.client).listen();
    } catch (err) {
        console.error(err);
    }

    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (err) {
        console.log(err);
    }

    app.listen(port, () => console.log(`\x1b[32mServer is listening on port ${port}\x1b[0m`));
}

start();
