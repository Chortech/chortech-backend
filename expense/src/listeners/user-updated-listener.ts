import { IUserCreated, Listener, Subjects } from "@chortec/common";
import { Message } from "node-nats-streaming";
import { User } from "../models/user";
import { graph } from "../utils/neo";
export class UserUpdatedListener extends Listener<IUserUpdated> {
  subject: Subjects.UserUpdated = Subjects.UserUpdated;
  queueName = "expense-service";
  async onMessage(data: IUserUpdated["data"], done: Message) {
    try {
      if (!User.exists(data.id))
        throw new Error("Can't update a user who does not exist.");
      await User.update(data);
      done.ack();
    } catch (error) {
      console.log(error);
    }
  }
}
