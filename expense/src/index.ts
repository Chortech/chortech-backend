import { app } from "./app";
import { natsWrapper } from "./utils/nats-wrapper";
import { randomBytes } from "crypto";
import { UserCreatedListener } from "./listeners/user-created-listener";
import { graph } from "./utils/neo";
import { GroupCreatedListener } from "./listeners/group-created-listener";
import { GroupDeletedListener } from "./listeners/group-deleted-listener";
import { GroupUpdatedListener } from "./listeners/group-updated-listener";
import { UserUpdatedListener } from "./listeners/user-updated-listener";

async function start() {
  const port = process.env.PORT || 3000;
  const natsClusterId = process.env.NATS_CLUSTER_ID || "chortec";
  const natsClientId =
    process.env.NATS_CLIENT_ID || randomBytes(4).toString("hex");
  const natsUrl = process.env.NATS_URL || "http://localhost:4222";

  const neoUrl = process.env.NEO4J_URL || "bolt://localhost";
  const neoUsername = process.env.NEO4J_USERNAME || "neo4j";
  const neoPassword = process.env.NEO4J_PASSWORD || "neo4j";

  while (true) {
    try {
      // console.log(neoUrl);
      await graph.init(neoUrl, neoUsername, neoPassword);
      console.log("connected to neo4j");
      process.on("SIGTERM", () => graph.driver.close());
      process.on("SIGINT", () => graph.driver.close());
      break;
    } catch (err) {
      // console.log(err);
      continue;
    }
  }
  try {
    await natsWrapper.connect(natsClusterId, natsClientId, natsUrl);
    new UserCreatedListener(natsWrapper.client).listen();
    new UserUpdatedListener(natsWrapper.client).listen();
    new GroupCreatedListener(natsWrapper.client).listen();
    new GroupDeletedListener(natsWrapper.client).listen();
    new GroupUpdatedListener(natsWrapper.client).listen();
  } catch (err) {
    console.error(err);
  }
  app.listen(port, () =>
    console.log(`\x1b[32mServer is listening on port ${port}\x1b[0m`)
  );
}

start();
