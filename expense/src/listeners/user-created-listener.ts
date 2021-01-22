import { IUserCreated, Listener, Subjects } from "@chortec/common";
import { Message } from "node-nats-streaming";
import { User } from "../models/user";
import { graph } from "../utils/neo";
export class UserCreatedListener extends Listener<IUserCreated> {
  subject: Subjects.UserCreated = Subjects.UserCreated;
  queueName = "expense-service";
  async onMessage(data: IUserCreated["data"], done: Message) {
    try {
      if (await User.exists(data.id))
        throw new Error("User Already exists. This shouldn't happen!");

      await User.create(data);
      done.ack();
    } catch (error) {
      console.log(error);
    }
  }
}
