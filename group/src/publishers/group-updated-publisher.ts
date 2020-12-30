import { IGroupUpdated, Publisher, Subjects } from "@chortec/common";

export class GroupUpdatedPublisher extends Publisher<IGroupUpdated> {
  subject: Subjects.GroupUpdated = Subjects.GroupUpdated;
}
