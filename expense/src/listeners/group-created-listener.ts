import { IGroupCreated, Listener, Subjects } from "@chortec/common";
import { Message } from "node-nats-streaming";
import { Group } from "../models/group";

export class GroupCreatedListener extends Listener<IGroupCreated> {
  subject: Subjects.GroupCreated = Subjects.GroupCreated;
  queueName = "expense-service";
  async onMessage(data: IGroupCreated["data"], done: Message) {
    try {
      console.log(data);

      await Group.create({
        id: data.id,
        name: data.name,
        picture: data.picture,
        owner: data.creator,
        members: [],
      });

      done.ack();
    } catch (err) {
      console.log(err);
    }
  }
}
