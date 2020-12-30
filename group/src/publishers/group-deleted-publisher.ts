import { IGroupDeleted, Publisher, Subjects } from "../../../common/src/index";

export class GroupDeletedPublisher extends Publisher<IGroupDeleted> {
  subject: Subjects.GroupDeleted = Subjects.GroupDeleted;
}
