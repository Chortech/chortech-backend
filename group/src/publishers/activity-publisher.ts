import { IActivity, Publisher, Subjects } from '@chortec/common';


export class ActivityPublisher extends Publisher<IActivity> {
  subject: Subjects.Activity = Subjects.Activity;
}