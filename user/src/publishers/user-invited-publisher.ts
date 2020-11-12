import { IUserInvited, Publisher, Subjects } from "@chortec/common";

export class UserInvitedPublisher extends Publisher<IUserInvited> {
  subject: Subjects.UserInvited = Subjects.UserInvited;
}
