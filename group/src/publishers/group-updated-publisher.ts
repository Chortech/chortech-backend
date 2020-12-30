import { IGroupUpdated, Publisher, Subjects } from "../../../common/src/index";

export class GroupUpdatedPublisher extends Publisher<IGroupUpdated> {
  subject: Subjects.GroupUpdated = Subjects.GroupUpdated;
}
