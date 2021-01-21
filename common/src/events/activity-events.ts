import { Subjects } from './subjects';


interface IData {
  subject: { id: string, name: string };
  object: { id: string, name: string };
  parent?: { id: string, name: string };
  action: Action;
  involved: string[];
  data?: Object;
}

export enum Action {
  Created = 'CREATED',
  Deleted = 'DELETED',
  Updated = 'UPDATED',
  Added = 'ADDED',
  Removed = 'REMOVED',
  Left = 'LEFT',
  Paid = 'PAID',
  Commented = 'COMMENTED'
}

interface IActivityCommented {
  subject: Subjects.ActivityCommented;
  data: IData
}

interface IActivityGroupCreated {
  subject: Subjects.ActivityGroupCreated;
  data: IData
}

interface IActivityGroupDeleted {
  subject: Subjects.ActivityGroupDeleted;
  data: IData
}

interface IActivityGroupAdded {
  subject: Subjects.ActivityGroupAdded;
  data: IData
}

interface IActivityGroupRemoved {
  subject: Subjects.ActivityGroupRemoved;
  data: IData
}

interface IActivityGroupUpdated{
  subject: Subjects.ActivityGroupUpdated;
  data: IData
}

interface IActivityGroupLeft {
  subject: Subjects.ActivityGroupLeft;
  data: IData
}

interface IActivityExpenseCreated {
  subject: Subjects.ActivityExpenseCreated;
  data: IData
}

interface IActivityExpensePaid {
  subject: Subjects.ActivityExpensePaid;
  data: IData
}

interface IActivityExpenseUpdated {
  subject: Subjects.ActivityExpenseUpdated;
  data: IData
}

interface IActivityExpenseDeleted {
  subject: Subjects.ActivityExpenseDeleted;
  data: IData
}

export { 
  IActivityCommented,
  IActivityGroupCreated,
  IActivityGroupDeleted,
  IActivityGroupAdded,
  IActivityGroupRemoved,
  IActivityGroupUpdated,
  IActivityGroupLeft,
  IActivityExpenseCreated,
  IActivityExpensePaid,
  IActivityExpenseUpdated,
  IActivityExpenseDeleted
};