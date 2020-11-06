import nats, { Stan } from "node-nats-streaming";

export class NatsWrapper {
  private _client?: Stan;

  get client(): Stan {
    if (!this._client) throw new Error("Cannot access nats before connecting");

    return this._client;
  }

  connect(clusterId: string, clientId: string, url: string): Promise<void> {
    this._client = nats.connect(clusterId, clientId, { url });

    process.on("SIGINT", this.client.close);
    process.on("SIGTERM", this.client.close);

    return new Promise((res, rej) => {
      this.client.on("connect", () => {
        console.log("Connected to NATS");
        res();
      });
      this.client.on("error", (err) => {
        rej(err);
      });
    });
  }
}
