import { Subjects } from "./subjects";

interface IUserCreated {
  subject: Subjects.UserCreated;
  data: {
    id: string;
    phone: string;
    email: string;
    name: string;
  };
}
interface IUserInvited {
  subject: Subjects.UserInvited;
  data: {
    Inviter: { id: string; name: string; email?: string; phone?: string };
    Invitees: [{ name: string; phone?: string; email?: string }];
  };
}
export { IUserCreated, IUserInvited };
