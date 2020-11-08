import { IUserCreated, Listener, Subjects } from "@chortec/common";
import mongoose, { Schema } from "mongoose";
import { Message } from "node-nats-streaming";
import User from "../models/user";
export class UserCreatedListener extends Listener<IUserCreated> {
  subject = Subjects.UserCreated;
  queueName = "user-service";
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
