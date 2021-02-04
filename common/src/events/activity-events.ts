import { Subjects } from './subjects';


export interface IData {
  subject: { id: string, name: string, type: Type };
  object: { id: string, name: string, type: Type };
  parent?: { id: string, name: string, type: Type };
  action: Action;
  involved: string[];
  data?: Object;
  request?: { type: Type, id: string };
}

export enum Action {
  Created = 'created',
  Deleted = 'deleted',
  Updated = 'updated',
  Added = 'added',
  Removed = 'removed',
  Left = 'left',
  Paid = 'paid',
  Commented = 'commented'
}

export enum Type {
  Expense = 'expense',
  Group = 'group',
  Payment = 'payment',
  User = 'user'
}

interface IActivity {
  subject: Subjects.Activity;
  data: IData | IData[];
}

export { IActivity };