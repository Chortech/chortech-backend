import {
  IInviteeCreated,
  IUserCreated,
  Publisher,
  Subjects,
} from "@chortec/common";

class UserCreatedPub extends Publisher<IUserCreated> {
  subject: Subjects.UserCreated = Subjects.UserCreated;
}

class InviteeCreatedPub extends Publisher<IInviteeCreated> {
  subject: Subjects.InviteeCreated = Subjects.InviteeCreated;
}

export { UserCreatedPub, InviteeCreatedPub };
