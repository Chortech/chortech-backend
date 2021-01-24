import { IUserUpdated, Publisher, Subjects } from "@chortec/common";

export class UserUpdatedPublisher extends Publisher<IUserUpdated> {
  subject: Subjects.UserUpdated = Subjects.UserUpdated;
}
