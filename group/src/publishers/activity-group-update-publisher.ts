import { IActivityGroupUpdated, Publisher, Subjects } from '@chortec/common';


export class ActivityGroupUpdatedPublisher extends Publisher<IActivityGroupUpdated> {
  subject: Subjects.ActivityGroupUpdated = Subjects.ActivityGroupUpdated;
}