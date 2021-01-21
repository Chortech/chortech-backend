import { IActivityGroupRemoved, Listener, Subjects } from '@chortec/common';
import { Message } from 'node-nats-streaming';
import Activity from '../models/activity';


export class ActivityGroupRemovedListener extends Listener<IActivityGroupRemoved> {
  subject: Subjects.ActivityGroupRemoved = Subjects.ActivityGroupRemoved;
  queueName = 'activity-service';
  
  async onMessage(data: IActivityGroupRemoved['data'], done: Message) {
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