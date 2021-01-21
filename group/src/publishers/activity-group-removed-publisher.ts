import { IActivityGroupRemoved, Publisher, Subjects } from '@chortec/common';


export class ActivityGroupRemovedPublisher extends Publisher<IActivityGroupRemoved> {
  subject: Subjects.ActivityGroupRemoved = Subjects.ActivityGroupRemoved;
}