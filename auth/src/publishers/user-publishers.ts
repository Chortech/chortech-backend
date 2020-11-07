import { IUserCreated, Publisher, Subjects } from "@chortec/common";

class UserCreatedPub extends Publisher<IUserCreated> {
  subject: Subjects.UserCreated = Subjects.UserCreated;
}

export { UserCreatedPub };
