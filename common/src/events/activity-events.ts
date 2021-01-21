import { Subjects } from './subjects';


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
  data: {
    subject: { id: string, name: string };
    object: { id: string, name: string };
    parent?: { id: string, name: string };
    action: Action;
    involved: string[];
    data?: Object;
  };
}

interface IActivityGroupCreated {
  subject: Subjects.ActivityGroupCreated;
  data: {
    subject: { id: string, name: string };
    object: { id: string, name: string };
    parent?: { id: string, name: string };
    action: Action;
    involved: string[];
    data?: Object;
  };
}

interface IActivityGroupDeleted {
  subject: Subjects.ActivityGroupDeleted;
  data: {
    subject: { id: string, name: string };
    object: { id: string, name: string };
    parent?: { id: string, name: string };
    action: Action;
    involved: string[];
    data?: Object;
  };
}

interface IActivityGroupAdded {
  subject: Subjects.ActivityGroupAdded;
  data: {
    subject: { id: string, name: string };
    object: { id: string, name: string };
    parent?: { id: string, name: string };
    action: Action;
    involved: string[];
    data?: Object;
  };
}

interface IActivityGroupRemoved {
  subject: Subjects.ActivityGroupRemoved;
  data: {
    subject: { id: string, name: string };
    object: { id: string, name: string };
    parent?: { id: string, name: string };
    action: Action;
    involved: string[];
    data?: Object;
  };
}

interface IActivityGroupUpdated{
  subject: Subjects.ActivityGroupUpdated;
  data: {
    subject: { id: string, name: string };
    object: { id: string, name: string };
    parent?: { id: string, name: string };
    action: Action;
    involved: string[];
    data?: Object;
  };
}

interface IActivityGroupLeft {
  subject: Subjects.ActivityGroupLeft;
  data: {
    subject: { id: string, name: string };
    object: { id: string, name: string };
    parent?: { id: string, name: string };
    action: Action;
    involved: string[];
    data?: Object;
  };
}

interface IActivityExpenseCreated {
  subject: Subjects.ActivityExpenseCreated;
  data: {
    subject: { id: string, name: string };
    object: { id: string, name: string };
    parent?: { id: string, name: string };
    action: Action;
    involved: string[];
    data?: Object;
  };
}

interface IActivityExpensePaid {
  subject: Subjects.ActivityExpensePaid;
  data: {
    subject: { id: string, name: string };
    object: { id: string, name: string };
    parent?: { id: string, name: string };
    action: Action;
    involved: string[];
    data?: Object;
  };
}

interface IActivityExpenseUpdated {
  subject: Subjects.ActivityExpenseUpdated;
  data: {
    subject: { id: string, name: string };
    object: { id: string, name: string };
    parent?: { id: string, name: string };
    action: Action;
    involved: string[];
    data?: Object;
  };
}

interface IActivityExpenseDeleted {
  subject: Subjects.ActivityExpenseDeleted;
  data: {
    subject: { id: string, name: string };
    object: { id: string, name: string };
    parent?: { id: string, name: string };
    action: Action;
    involved: string[];
    data?: Object;
  };
}