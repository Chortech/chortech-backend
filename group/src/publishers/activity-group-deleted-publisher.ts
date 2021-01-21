import { IActivityGroupDeleted, Publisher, Subjects } from '@chortec/common';


export class ActivityGroupDeletedPublisher extends Publisher<IActivityGroupDeleted> {
  subject: Subjects.ActivityGroupDeleted = Subjects.ActivityGroupDeleted;
}