import { Subjects } from "./subjects";

interface IGroupCreated {
  subject: Subjects.GroupCreated;
  data: {
    id: string;
    name: string;
    picture?: string;
    creator: string;
  };
}
interface IGroupUpdated {
  subject: Subjects.GroupUpdated;
  data: {
    id: string;
    name?: string;
    picture?: string;
    creator?: string;
    members?: string[];
    left?: string;
    removed?: string;
    type: GroupUpdateType;
  };
}
interface IGroupDeleted {
  subject: Subjects.GroupDeleted;
  data: {
    id: string;
  };
}

enum GroupUpdateType {
  AddMember = "add",
  RemoveMember = "remove",
  LeaveGroup = "leave",
  EditInfo = "edit",
}

export { IGroupCreated, IGroupUpdated, IGroupDeleted, GroupUpdateType };
