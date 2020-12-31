import { IGroupDeleted, Listener, Subjects } from "@chortec/common";
import { Message } from "node-nats-streaming";
import { Group } from "../models/group";
export class GroupDeletedListener extends Listener<IGroupDeleted> {
  subject: Subjects.GroupDeleted = Subjects.GroupDeleted;
  queueName = "expense-service";
  async onMessage(data: IGroupDeleted["data"], done: Message) {
    try {
      await Group.delete(data.id);

      done.ack();
    } catch (err) {
      console.log(err);
    }
  }
}
