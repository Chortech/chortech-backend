import { IGroupDeleted, Publisher, Subjects } from "@chortec/common";

export class GroupDeletedPublisher extends Publisher<IGroupDeleted> {
  subject: Subjects.GroupDeleted = Subjects.GroupDeleted;
}
