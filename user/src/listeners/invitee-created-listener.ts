import {
  IInviteeCreated,
  IUserCreated,
  Listener,
  Subjects,
} from "@chortec/common";
import mongoose, { Schema, Types } from "mongoose";
import { Message } from "node-nats-streaming";
import User from "../models/user";
export class InviteeCreatedListener extends Listener<IInviteeCreated> {
  subject: Subjects.InviteeCreated = Subjects.InviteeCreated;
  queueName = "user-service";
  async onMessage(data: IInviteeCreated["data"], done: Message) {
    try {
      const {
        inviter,
        invitee: { id, email, name, phone },
      } = data;
      const inviterId = mongoose.Types.ObjectId(inviter);

      if (!(await User.exists({ _id: inviterId })))
        throw new Error("Shouldn't happen!");

      const user = User.build({
        id: id,
        name: name,
        email: email,
        phone: phone,
        friends: [inviterId],
        myCreditCards:[],
        otherCreditCards:[]
      });

      await User.updateOne(
        { _id: inviterId, friends: { $nin: [user._id] } },
        { $push: { friends: new mongoose.Types.ObjectId(id) } }
      );

      await user.save();

      done.ack();
    } catch (error) {
      console.log(error);
    }
  }
}
