import nats, { Stan } from "node-nats-streaming";

class NatsWrapper {
  private _client?: Stan;

  get client(): Stan {
    if (!this._client) throw new Error("Cannot access nats before connecting");

    return this._client;
  }

  connect(clusterId: string, clientId: string, url: string): Promise<void> {
    return new Promise((res, rej) => {
      try {
        this._client = nats.connect(clusterId, clientId, { url });

        this.client.on("connect", () => {
          console.log("Connected to NATS");
          res();
        });
        this.client.on("error", (err) => {
          rej(err);
        });
      } catch (err) {
        rej(err);
      }
    });
  }
}

export const natsWrapper = new NatsWrapper();
