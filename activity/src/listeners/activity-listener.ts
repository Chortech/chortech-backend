import { IData, IActivity, Listener, Subjects } from '@chortec/common';
import { Message } from 'node-nats-streaming';
import Activity from '../models/activity';


export class ActivityListener extends Listener<IActivity> {
  subject: Subjects.Activity = Subjects.Activity;
  queueName = 'activity-service';
  
  async onMessage(data: IActivity['data'], done: Message) {
    try {
      if (Array.isArray(data)) {
        for (let activity of data) {
          const act = Activity.build({
            subject: activity.subject,
            object: activity.object,
            parent: activity.parent,
            action: activity.action,
            involved: activity.involved,
            data: activity.data,
            type: activity.type
          });

          await act.save();
        }
      } else {
        const act = Activity.build({
          subject: data.subject,
          object: data.object,
          parent: data.parent,
          action: data.action,
          involved: data.involved,
          data: data.data,
          type: data.type
        });

        await act.save();
      }

      done.ack();
    } catch (error) {
      console.log(error)
    }
  }
}