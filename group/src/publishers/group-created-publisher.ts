import { IGroupCreated, Publisher, Subjects } from "@chortec/common";

export class GroupCreatedPublisher extends Publisher<IGroupCreated> {
  subject: Subjects.GroupCreated = Subjects.GroupCreated;
}
