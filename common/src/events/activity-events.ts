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

interface IActivity {
  subject: Subjects.Activity;
  data: IData | IData[];
}

export { IActivity };