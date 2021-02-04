import { Stan, Message } from "node-nats-streaming";
import { Event } from "./base-event";

export abstract class Listener<T extends Event> {
  private client: Stan;
  abstract subject: T["subject"];
  abstract queueName: string;
  ackWait = 5 * 1000;
  abstract onMessage(data: T["data"], done: Message): void;

  constructor(client: Stan) {
    this.client = client;
  }

  subscriptionOptions() {
    return this.client
      .subscriptionOptions()
      .setManualAckMode(true)
      .setAckWait(this.ackWait)
      .setDeliverAllAvailable()
      .setDurableName(this.queueName);
  }

  listen() {
    const sub = this.client.subscribe(
      this.subject,
      this.queueName,
      this.subscriptionOptions()
    );

    sub.on("message", (msg: Message) => {
      console.log(`message recieved: ${msg.getData()}`);

      const parsed = this.parseMessage(msg);
      this.onMessage(parsed, msg);
    });
  }

  parseMessage(msg: Message) {
    const data = msg.getData();
    return typeof data === "string"
      ? JSON.parse(data)
      : JSON.parse(data.toString("utf-8"));
  }
}
