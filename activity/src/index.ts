import { app } from "./app";
import mongoose from "mongoose";
import { randomBytes } from "crypto";

async function start() {
    const port = process.env.PORT || 3000;
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/group';
    const natsClusterId = process.env.NATS_CLUSTER_ID || "chortec";
    const natsClientId =
        process.env.NATS_CLIENT_ID || randomBytes(4).toString("hex");
    // const natsUrl = process.env.NATS_URL || "http://localhost:4222";
    // try {
    //     await natsWrapper.connect(natsClusterId, natsClientId, natsUrl);
    // } catch (err) {
    //     console.error(err);
    // }

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
