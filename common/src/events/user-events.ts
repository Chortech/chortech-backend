import { Subjects } from "./subjects";

interface IUserCreated {
  subject: Subjects.UserCreated;
  data: {
    id: string;
    ohone: string;
    email: string;
    name: string;
  };
}


export { IUserCreated }