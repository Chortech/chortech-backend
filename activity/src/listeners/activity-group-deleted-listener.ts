import { IActivityGroupDeleted, Listener, Subjects } from '@chortec/common';
import { Message } from 'node-nats-streaming';
import Activity from '../models/activity';


export class ActivityGroupDeletedListener extends Listener<IActivityGroupDeleted> {
  subject: Subjects.ActivityGroupDeleted = Subjects.ActivityGroupDeleted;
  queueName = 'activity-service';
  
  async onMessage(data: IActivityGroupDeleted['data'], done: Message) {
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