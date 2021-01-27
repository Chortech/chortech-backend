import { app } from "./app";
import { natsWrapper } from "./utils/nats-wrapper";
import { randomBytes } from "crypto";
import path from "path";
import fs from "fs";
import { notification } from "./utils/notif-wrapper";

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

  //   const secrets = JSON.parse(fs.readFileSync(secpath, "utf-8"));
  //   const keys = Object.keys(secrets);
  //   for (const key of keys) {
  //     process.env[key] = secrets[key];
  //   }

  //   if (!process.env.type) throw new Error("type must be defined!");
  //   if (!process.env.project_id) throw new Error("project_id must be defined!");
  //   if (!process.env.private_key_id)
  //     throw new Error("private_key_id must be defined!");
  //   if (!process.env.private_key) throw new Error("private_key must be defined!");
  //   if (!process.env.client_email)
  //     throw new Error("client_email must be defined!");
  //   if (!process.env.client_id) throw new Error("client_id must be defined!");
  //   if (!process.env.auth_uri) throw new Error("auth_uri must be defined!");
  //   if (!process.env.token_uri) throw new Error("token_uri must be defined!");
  //   if (!process.env.auth_provider_x509_cert_url)
  //     throw new Error("auth_provider_x509_cert_url must be defined!");
  //   if (!process.env.client_x509_cert_url)
  //     throw new Error("client_x509_cert_url must be defined!");

  const port = process.env.PORT || 3000;
  const natsClusterId = process.env.NATS_CLUSTER_ID || "chortec";
  const natsClientId =
    process.env.NATS_CLIENT_ID || randomBytes(4).toString("hex");
  const natsUrl = process.env.NATS_URL || "http://localhost:4222";
  try {
    await natsWrapper.connect(natsClusterId, natsClientId, natsUrl);
  } catch (err) {
    console.error(err);
  }

  app.listen(port, () =>
    console.log(`\x1b[32mServer is listening on port ${port}\x1b[0m`)
  );
}

start();
