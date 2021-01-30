import { IData, IActivity, Listener, Subjects } from "@chortec/common";
import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import User from "../models/user";
import { handler } from "../utils/activity-parser";
import { notification } from "../utils/notif-wrapper";

export class ActivityListener extends Listener<IActivity> {
  subject: Subjects.Activity = Subjects.Activity;
  queueName = "activity-service";

  async onMessage(data: IActivity["data"], done: Message) {
    try {
      if (Array.isArray(data)) {
        for (const d of data) {
          await this.send(d);
        }
        return done.ack();
      }

      await this.send(data);

      done.ack();
    } catch (error) {
      console.log(error);
    }
  }

  private async send(data: IData) {
    const involved = data.involved.map((x) => new mongoose.Types.ObjectId(x));
    const users = await User.find({ _id: { $in: involved } });
    const tokens = users.map((x: any) => x.token);
    const message = handler.handle(data);
    await notification.sendMessageMulticast(message, tokens);
  }
}

// if (Array.isArray(data)) {
//   for (let activity of data) {
//     const act = Activity.build({
//       subject: activity.subject,
//       object: activity.object,
//       parent: activity.parent,
//       action: activity.action,
//       involved: activity.involved,
//       data: activity.data,
//       request: activity.request
//     });

//     await act.save();
//   }
// } else {
//   const act = Activity.build({
//     subject: data.subject,
//     object: data.object,
//     parent: data.parent,
//     action: data.action,
//     involved: data.involved,
//     data: data.data,
//     request: data.request
//   });

//   await act.save();
// }
