import { Listener, Subjects, IUserUpdated } from '@chortec/common';
import { Message } from 'node-nats-streaming';
import { User } from '../models/user';


export class UserUpdatedListener extends Listener<IUserUpdated> {
  subject: Subjects.UserUpdated = Subjects.UserUpdated;
  queueName = 'group-service';
  async onMessage(data: IUserUpdated["data"], done: Message) {
    try {
      if (!await User.exists({_id: data.id}))
        throw new Error("Can't update a user who does not exist.");

      await User.updateOne({ _id: data.id }, data);
      done.ack();
    } catch (error) {
      console.log(error);
    }
  }
}
