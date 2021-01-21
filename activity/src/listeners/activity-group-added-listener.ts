import { IActivityGroupAdded, Listener, Subjects } from '@chortec/common';
import { Message } from 'node-nats-streaming';
import Activity from '../models/activity';


export class ActivityGroupAddedListener extends Listener<IActivityGroupAdded> {
  subject: Subjects.ActivityGroupAdded = Subjects.ActivityGroupAdded;
  queueName = 'activity-service';
  
  async onMessage(data: IActivityGroupAdded['data'], done: Message) {
    try {
      const activity = Activity.build({
        subject: data.subject,
        object: data.object,
        parent: data.parent,
        action: data.action,
        involved: data.involved,
        data: data.data
      });

      await activity.save();
      done.ack();
    } catch (error) {
      console.log(error)
    }
  }
}