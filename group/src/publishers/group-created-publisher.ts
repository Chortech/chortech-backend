import { IGroupCreated, Publisher, Subjects } from "../../../common/src/index";

export class GroupCreatedPublisher extends Publisher<IGroupCreated> {
  subject: Subjects.GroupCreated = Subjects.GroupCreated;
}
