import { IActivityGroupLeft, Listener, Subjects } from '@chortec/common';
import { Message } from 'node-nats-streaming';
import Activity from '../models/activity';


export class ActivityGroupLeftListener extends Listener<IActivityGroupLeft> {
  subject: Subjects.ActivityGroupLeft = Subjects.ActivityGroupLeft;
  queueName = 'activity-service';
  
  async onMessage(data: IActivityGroupLeft['data'], done: Message) {
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