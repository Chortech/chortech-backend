import { Stan } from "node-nats-streaming";
import { Event } from "./base-event";

abstract class Publisher<T extends Event> {
  abstract subject: T["subject"];
  private client: Stan;
  constructor(client: Stan) {
    this.client = client;
  }

  publish(data: T["data"]): Promise<string> {
    return new Promise((res, rej) => {
      this.client.publish(this.subject, data, (err, id) => {
        if (err) return rej(err);
        console.log(`Event ${this.subject}:${id} published.`);
        res(id);
      });
    });
  }
}
