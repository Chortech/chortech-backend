import { IActivityGroupDeleted, Publisher, Subjects } from '@chortec/common';


export class ActivityGroupCreatedPublisher extends Publisher<IActivityGroupDeleted> {
  subject: Subjects.ActivityGroupDeleted = Subjects.ActivityGroupDeleted;
}