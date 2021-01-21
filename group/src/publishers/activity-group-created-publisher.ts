import { IActivityGroupCreated, Publisher, Subjects } from '@chortec/common';


export class ActivityGroupCreatedPublisher extends Publisher<IActivityGroupCreated> {
  subject: Subjects.ActivityGroupCreated = Subjects.ActivityGroupCreated;
}