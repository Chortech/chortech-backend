import { IUserCreated, Listener, Subjects } from "@chortec/common";
import { Message } from "node-nats-streaming";
import { graph } from "../utils/neo";
export class UserCreatedListener extends Listener<IUserCreated> {
  subject: Subjects.UserCreated = Subjects.UserCreated;
  queueName = "user-service";
  async onMessage(data: IUserCreated["data"], done: Message) {
    try {
      await graph.createUser(data.id, data.name);
    } catch (error) {
      console.log(error);
    }
  }
}
