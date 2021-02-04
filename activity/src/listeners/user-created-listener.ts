import { IUserCreated, Listener, Subjects } from "@chortec/common";
import { Message } from "node-nats-streaming";
import User from "../models/user";
export class UserCreatedListener extends Listener<IUserCreated> {
  subject: Subjects.UserCreated = Subjects.UserCreated;
  queueName = "activity-service";
  async onMessage(data: IUserCreated["data"], done: Message) {
    try {
      const user = User.build({
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
      });

      await user.save();

      done.ack();
    } catch (error) {
      console.log(error);
    }
  }
}
