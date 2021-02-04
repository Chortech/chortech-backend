import { IExpense } from "./expense";
import util from "util";

interface IParticipant {
  id: string;
  name?: string;
  amount: number;
  role: PRole;
}

type IParticipantExtended =
  | IParticipant
  | (IParticipant & {
      role: PRole.Debtor;
      owes: { id: string; amount: number }[];
    });

// Participant Role
enum PRole {
  Debtor = "debtor",
  Creditor = "creditor",
}

class Participant {
  static equals(p1: IParticipant, p2: IParticipant) {
    return p1.id === p2.id && p1.amount === p2.amount && p1.role === p2.role;
  }
}

class ParticipantsIterator {
  debtors: IParticipant[];
  creditors: IParticipant[];
  private currentDebtor?: IParticipant;
  private currentCreditor?: IParticipant;

  // Since the value of amount for debtor and creditors can change
  // we hold the actual value for when we might need it later.

  private tempAmount: { d: number; c: number };
  constructor(expense: IExpense) {
    const seperated = this.seperateParticipants(expense);
    this.debtors = seperated.debtors;
    this.creditors = seperated.creditors;
    this.tempAmount = { d: -1, c: -1 };
  }
  get creditor() {
    return this.currentCreditor;
  }
  get debtor() {
    return this.currentDebtor;
  }
  get pair() {
    return { d: this.debtor, c: this.creditor };
  }

  get pairAmount() {
    return this.tempAmount;
  }

  nextCreditor() {
    this.currentCreditor = this.creditors.pop();
    this.tempAmount.c = this.currentCreditor
      ? this.currentCreditor.amount
      : -Number.MAX_VALUE;
  }
  nextDebtor() {
    this.currentDebtor = this.debtors.pop();
    this.tempAmount.d = this.currentDebtor
      ? this.currentDebtor.amount
      : -Number.MAX_VALUE;
  }

  next() {
    this.nextCreditor();
    this.nextDebtor();
  }

  /**
   * @description seperates participants into 2 groups, debtors and creditors
   * and sorts them in ascending order.
   * It also updates the expense total when there are duplicates. So by deleting
   * duplicates (i.e. someone who is both debtor and creditor) the amount will be
   * less than the actual amount received by the user.
   */

  seperateParticipants(expense: IExpense) {
    const cmap = new Map<string, IParticipant>();
    const dmap = new Map<string, IParticipant>();

    for (const p of expense.participants) {
      if (p.role === PRole.Creditor) cmap.set(p.id, p);
      else dmap.set(p.id, p);
    }

    cmap.forEach((c) => {
      if (dmap.has(c.id)) {
        const d = dmap.get(c.id)!;
        if (Math.abs(c.amount - d.amount) < Number.EPSILON) {
          expense.total -= d.amount;
          dmap.delete(d.id);
          cmap.delete(c.id);
          // if creditor is bigger subtract debtor from it and remove debtor
        } else if (c.amount > d.amount) {
          expense.total -= d.amount;
          c.amount -= d.amount;
          dmap.delete(d.id);
          // if debtor is bigger subtract creditor from it and remove creditor
        } else {
          expense.total -= c.amount;
          d.amount -= c.amount;
          cmap.delete(c.id);
        }
      }
    });
    const creditors = Array.from(cmap.values()).sort(
      (a, b) => a.amount - b.amount
    );
    const debtors = Array.from(dmap.values()).sort(
      (a, b) => a.amount - b.amount
    );
    return { creditors, debtors };
  }
}

class ParticipantHandler {
  private iterator: ParticipantsIterator;
  private _participants: IParticipantExtended[];
  private currentTotal: number; // we start from current total of zero
  private targetTotal: number; // this is the final value of currentTotal this class should end at there
  private owes: { id: string; amount: number }[];
  constructor(expense: IExpense) {
    this.iterator = new ParticipantsIterator(expense);

    // you should set this after creating the iterator
    // because iterator might change the expense total
    this.targetTotal = expense.total;
    this.iterator.next();
    this._participants = [];
    this.currentTotal = 0;
    this.owes = [];
  }

  get participants() {
    return this._participants;
  }

  handle() {
    let pair = this.iterator.pair;
    let pairAmount = this.iterator.pairAmount;
    let lent = pair.c?.amount!;
    let borrowed = pair.d?.amount!;
    // if lent money is equal borrowed money cross each one
    if (Math.abs(lent - borrowed) < Number.EPSILON) {
      this.currentTotal += lent;
      this.owes.push({ id: pair.c!.id, amount: pair.c!.amount });
      this._participants.push({
        id: pair.d!.id,
        role: PRole.Debtor,
        amount: pairAmount!.d,
        owes: this.owes,
      });
      this._participants.push({
        id: pair.c!.id,
        role: PRole.Creditor,
        amount: pairAmount!.c,
      });

      this.iterator.next();
      this.owes = [];
    }
    // if lent money is smaller that money borrowed cross
    // creditor but keep debtor to cross it next iterations
    // with one debtor
    else if (lent < borrowed) {
      this.currentTotal += pair.c!.amount;
      this._participants.push({
        id: pair.c!.id,
        role: PRole.Creditor,
        amount: pairAmount!.c,
      });
      this.owes.push({ id: pair.c!.id, amount: pair.c!.amount });

      pair.d!.amount -= pair.c!.amount;
      this.iterator.nextCreditor();
    }
    // if money lent is bigger then corss one debtor and
    // hold creditor  to cross it with other debtors in
    // next iteration
    else {
      this.currentTotal += pair.d!.amount;
      this.owes.push({ id: pair.c!.id, amount: pair.d!.amount });
      this._participants.push({
        id: pair.d!.id,
        role: PRole.Debtor,
        amount: pairAmount.d,
        owes: this.owes,
      });
      this.owes = [];

      pair.c!.amount -= pair.d!.amount;
      this.iterator.nextDebtor();
    }
  }

  satisfied() {
    return Math.abs(this.currentTotal - this.targetTotal) > Number.EPSILON;
  }
}

export { IParticipant, PRole, Participant, ParticipantHandler };
