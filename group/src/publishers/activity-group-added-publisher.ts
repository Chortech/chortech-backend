import { IActivityGroupAdded, Publisher, Subjects } from '@chortec/common';


export class ActivityGroupAddedPublisher extends Publisher<IActivityGroupAdded> {
  subject: Subjects.ActivityGroupAdded = Subjects.ActivityGroupAdded;
}