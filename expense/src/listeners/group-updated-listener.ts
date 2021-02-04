import { IGroupUpdated, Listener, Subjects } from "@chortec/common";
import { Message } from "node-nats-streaming";
import { Group } from "../models/group";
export class GroupUpdatedListener extends Listener<IGroupUpdated> {
  subject: Subjects.GroupUpdated = Subjects.GroupUpdated;
  queueName = "expense-service";
  async onMessage(data: IGroupUpdated["data"], done: Message) {
    try {
      await Group.update(data);

      done.ack();
    } catch (err) {
      console.log(err);
    }
  }
}
