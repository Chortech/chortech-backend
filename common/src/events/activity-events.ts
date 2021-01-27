import { Subjects } from './subjects';


export interface IData {
  subject: { id: string, name: string };
  object: { id: string, name: string };
  parent?: { id: string, name: string };
  action: Action;
  involved: string[];
  data?: Object;
  type: Type;
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
  Group = 'group'
}

interface IActivity {
  subject: Subjects.Activity;
  data: IData | IData[];
}

export { IActivity };