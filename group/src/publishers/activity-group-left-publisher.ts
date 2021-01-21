import { IActivityGroupLeft, Publisher, Subjects } from '@chortec/common';


export class ActivityGroupLeftPublisher extends Publisher<IActivityGroupLeft> {
  subject: Subjects.ActivityGroupLeft = Subjects.ActivityGroupLeft;
}