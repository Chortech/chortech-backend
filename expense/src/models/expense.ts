import { graph, Nodes, Relations } from "../utils/neo";
import { IParticipant, PRole } from "./participant";
import { v4 as uuid } from "uuid";
import { BadRequestError } from "@chortec/common";
import { Comment, IComment } from "./comment";

interface IExpense {
  id: string;
  creator: string;
  description: string;
  participants: IParticipant[];
  total: number;
  comments?: IComment[];
  group?: string;
  notes?: string;
  paid_at: number;
  created_at: number;
  modified_at: number;
}

type ParticipantExtended =
  | IParticipant
  | (IParticipant & {
      role: PRole.Debtor;
      owes: { id: string; amount: number }[];
    });

class Expense {
  // TODO refactor this into multiple objects
  static async create(expense: IExpense) {
    const session = graph.runMultiple();
    let total = 0;
    const { creditors, debtors } = seperateParticipants(expense);
    let creditor = creditors.pop();
    let debtor = debtors.pop();
    const participants: ParticipantExtended[] = [];
    let owes: { id: string; amount: number }[] = new Array();
    let creditortemp = creditor!.amount;
    let debtortemp = debtor!.amount;
    while (Math.abs(total - expense.total) > Number.EPSILON) {
      let lent = creditor!.amount;
      let borrowed = debtor!.amount;

      if (Math.abs(lent - borrowed) < Number.EPSILON) {
        // If equal cross one creditor with one debtor
        total += creditor!.amount;
        owes.push({ id: creditor!.id, amount: creditor!.amount });
        participants.push({
          id: debtor!.id,
          role: PRole.Debtor,
          amount: debtortemp,
          owes,
        });
        participants.push({
          id: creditor!.id,
          role: PRole.Creditor,
          amount: creditortemp,
        });

        creditor = creditors.pop();
        debtor = debtors.pop();
        if (creditor) creditortemp = creditor!.amount;
        if (debtor) debtortemp = debtor!.amount;
        owes = new Array();
      } else if (lent < borrowed) {
        // If borrowed money is bigger cross creditor and keep debtor
        total += creditor!.amount;
        participants.push({
          id: creditor!.id,
          role: PRole.Creditor,
          amount: creditortemp,
        });
        owes.push({ id: creditor!.id, amount: creditor!.amount });

        debtor!.amount -= creditor!.amount;
        creditor = creditors.pop();
        if (creditor) creditortemp = creditor!.amount;
      } else {
        // If borrowed money is samller cross debtor and keep debtor
        total += debtor!.amount;
        owes.push({ id: creditor!.id, amount: debtor!.amount });
        participants.push({
          id: debtor!.id,
          role: PRole.Debtor,
          amount: debtortemp,
          owes,
        });
        owes = new Array();

        creditor!.amount -= debtor!.amount;
        debtor = debtors.pop();
        if (debtor) debtortemp = debtor!.amount;
      }
    }

    const id = uuid();
    // Create the expense and attach the participants to it
    await session.run(
      `
      MERGE (e:${Nodes.Expense} {id: $eid}) SET e= $expense WITH e
      UNWIND $participants as p
      WITH apoc.convert.toJson(p.owes) as owes , p, e
      MATCH (u:${Nodes.User} {id: p.id})
      MERGE (u)-[:${Relations.Participate} {role: p.role, amount: p.amount , owes: owes}]->(e)`,
      {
        expense: {
          id,
          creator: expense.creator,
          total: expense.total,
          group: expense.group,
          notes: expense.notes,
          paid_at: expense.paid_at,
          created_at: expense.created_at,
          modified_at: expense.modified_at,
          description: expense.description,
        },
        participants: participants,
        eid: id,
      }
    );

    await session.run(
      `
        UNWIND $participants AS p
        WITH p
        WHERE p.role = "debtor"
        MATCH (u1:User {id: p.id})
        UNWIND p.owes as owes	
        MATCH (u2:User {id: owes.id})
        MERGE (u1)-[r:OWE]-(u2)
        ON CREATE SET r.amount = owes.amount
        ON MATCH SET r.amount = r.amount + owes.amount
        WITH CASE
        WHEN startnode(r) = u1 THEN 0
        ELSE -2 * owes.amount
        END AS amount ,r
        SET r.amount = r.amount + amount
        WITH r
        CALL apoc.do.case(
        [
          r.amount = 0 , "DELETE r",
          r.amount < 0, "CALL apoc.refactor.invert(r) YIELD output as o SET o.amount = o.amount * -1"
        ],
        "RETURN r" , {r:r}
        ) 
        YIELD value
        RETURN value`,
      { participants: participants }
    );

    await session.close();

    return id;
  }

  // TODO refactor this into multiple functions
  static async update(expense: IExpense, hasChanged: boolean) {
    const session = graph.runMultiple();
    // remove old relation if participants changed
    // and then calculate new relations and update expense
    if (hasChanged) {
      // remove the owe relations for this expense
      await session.run(
        `MATCH (u:${Nodes.User})-[r:${Relations.Participate} {role:$role}]-(e:${Nodes.Expense} {id: $id})
          UNWIND apoc.convert.fromJsonList(r.owes) as owes
          MATCH (u)-[o:${Relations.Owe}]-(u2:${Nodes.User} {id: owes.id})
          SET o.amount = o.amount - owes.amount
          WITH o,e
          CALL apoc.do.case(
          [
            o.amount = 0 , "DELETE o",
            o.amount < 0, "CALL apoc.refactor.invert(o) YIELD output as out SET out.amount = out.amount * -1"
          ],
          "RETURN o" , {o:o}
          ) 
          YIELD value
          RETURN value`,
        {
          id: expense.id,
          role: PRole.Debtor,
        }
      );

      // remove the old participant relations for this expense
      await session.run(
        `MATCH (u:${Nodes.User})-[r:${Relations.Participate}]-(e:${Nodes.Expense} {id: $id})
            DELETE r;`,
        {
          id: expense.id,
          role: PRole.Debtor,
        }
      );

      let total = 0;
      const { creditors, debtors } = seperateParticipants(expense);
      let creditor = creditors.pop();
      let debtor = debtors.pop();
      const participants: ParticipantExtended[] = [];
      let owes: { id: string; amount: number }[] = new Array();
      let creditortemp = creditor!.amount;
      let debtortemp = debtor!.amount;
      while (Math.abs(total - expense.total) > Number.EPSILON) {
        let lent = creditor!.amount;
        let borrowed = debtor!.amount;

        if (Math.abs(lent - borrowed) < Number.EPSILON) {
          // If equal cross one creditor with one debtor
          total += creditor!.amount;
          owes.push({ id: creditor!.id, amount: creditor!.amount });
          participants.push({
            id: debtor!.id,
            role: PRole.Debtor,
            amount: debtortemp,
            owes,
          });
          participants.push({
            id: creditor!.id,
            role: PRole.Creditor,
            amount: creditortemp,
          });

          creditor = creditors.pop();
          debtor = debtors.pop();
          if (creditor) creditortemp = creditor!.amount;
          if (debtor) debtortemp = debtor!.amount;
          owes = new Array();
        } else if (lent < borrowed) {
          // If borrowed money is bigger cross creditor and keep debtor
          total += creditor!.amount;
          participants.push({
            id: creditor!.id,
            role: PRole.Creditor,
            amount: creditortemp,
          });
          owes.push({ id: creditor!.id, amount: creditor!.amount });

          debtor!.amount -= creditor!.amount;
          creditor = creditors.pop();
          if (creditor) creditortemp = creditor!.amount;
        } else {
          // If borrowed money is samller cross debtor and keep debtor
          total += debtor!.amount;
          owes.push({ id: creditor!.id, amount: debtor!.amount });
          participants.push({
            id: debtor!.id,
            role: PRole.Debtor,
            amount: debtortemp,
            owes,
          });
          owes = new Array();

          creditor!.amount -= debtor!.amount;
          debtor = debtors.pop();
          if (debtor) debtortemp = debtor!.amount;
        }
      }
      // Find the expense and attach the updated participants to it
      // console.log(participants);
      await session.run(
        `
        MATCH (e:${Nodes.Expense} {id: $eid}) SET e= $expense WITH e
        UNWIND $participants as p
        WITH apoc.convert.toJson(p.owes) as owes , p, e
        MATCH (u:${Nodes.User} {id: p.id})
        MERGE (u)-[:${Relations.Participate} {role: p.role, amount: p.amount , owes: owes}]->(e)`,
        {
          expense: {
            id: expense.id,
            creator: expense.creator,
            total: expense.total,
            group: expense.group,
            notes: expense.notes,
            paid_at: expense.paid_at,
            created_at: expense.created_at,
            modified_at: expense.modified_at,
            description: expense.description,
          },
          participants: participants,
          eid: expense.id,
        }
      );
      await session.run(
        `
          UNWIND $participants AS p
          WITH p
          WHERE p.role = "debtor"
          MATCH (u1:User {id: p.id})
          UNWIND p.owes as owes
          MATCH (u2:User {id: owes.id})
          MERGE (u1)-[r:OWE]-(u2)
          ON CREATE SET r.amount = owes.amount
          ON MATCH SET r.amount = r.amount + owes.amount
          WITH CASE
          WHEN startnode(r) = u1 THEN 0
          ELSE -2 * owes.amount
          END AS amount ,r
          SET r.amount = r.amount + amount
          WITH r
          CALL apoc.do.case(
          [
            r.amount = 0 , "DELETE r",
            r.amount < 0, "CALL apoc.refactor.invert(r) YIELD output as o SET o.amount = o.amount * -1"
          ],
          "RETURN r" , {r:r}
          )
          YIELD value
          RETURN value`,
        { participants: participants }
      );
    } else {
      await session.run(
        `
        MATCH (e:${Nodes.Expense} {id: $eid}) SET e= $expense RETURN e`,
        {
          expense: {
            id: expense.id,
            creator: expense.creator,
            total: expense.total,
            group: expense.group,
            notes: expense.notes,
            paid_at: expense.paid_at,
            created_at: expense.created_at,
            modified_at: expense.modified_at,
            description: expense.description,
          },
          eid: expense.id,
        }
      );
    }

    await session.close();
  }

  static async remove(expenseid: string) {
    const session = graph.driver.session();
    try {
      await session.run(
        `MATCH (u:${Nodes.User})-[r:${Relations.Participate} {role:$role}]-(e:${Nodes.Expense} {id: $id})
          UNWIND apoc.convert.fromJsonList(r.owes) as owes
          MATCH (u)-[o:${Relations.Owe}]-(u2:${Nodes.User} {id: owes.id})
          SET o.amount = o.amount - owes.amount
          WITH o,e
          CALL apoc.do.case(
          [
            o.amount = 0 , "DELETE o",
            o.amount < 0, "CALL apoc.refactor.invert(o) YIELD output as out SET out.amount = out.amount * -1"
          ],
          "RETURN o" , {o:o}
          ) 
          YIELD value
          RETURN value`,
        {
          id: expenseid,
          role: PRole.Debtor,
        }
      );

      if (await graph.deleteNode(Nodes.Expense, expenseid)) {
        await session.close();
        return true;
      }
    } catch (err) {
      console.log(err);
      session.close();
      throw err;
    }

    return false;
  }

  static async findById(expenseid: string) {
    const res = await graph.run(
      `MATCH (u:${Nodes.User})-[r:${Relations.Participate}]->(e:${Nodes.Expense} {id: $expenseid}) RETURN *`,
      {
        expenseid,
      }
    );

    const participants: any[] = [];

    for (const rec of res.records) {
      const p = rec.get("u");
      const r = rec.get("r");

      p.properties.role = r.properties.role;
      p.properties.amount = r.properties.amount;
      participants.push(p.properties);
    }

    return {
      ...res.records[0].get("e").properties,
      participants,
      comments: await Comment.findByExpenseId(expenseid),
    };
  }

  static async findByUserId(userid: string) {
    const res = await graph.run(
      `MATCH (:${Nodes.User} {id: $uid})-[r:${Relations.Participate}]->(e:${Nodes.Expense}) RETURN e,r`,
      {
        uid: userid,
      }
    );

    const expenses: any[] = [];
    for (const rec of res.records) {
      let expense = rec.get("e").properties;
      let relation = rec.get("r").properties;

      expense.you = {
        role: relation.role,
        amount: relation.amount,
      };
      expenses.push(expense);
    }

    return expenses;
  }

  /**
   *
   * @param id user id
   * @description returns details about who this user ows money
   * or need to get money from
   */
  static async findAssociatesByUserid(userid: string) {
    const res = await graph.run(
      "MATCH (u:User {id: $userid})-[r:OWE]-(u2:User) RETURN u,r,u2, (startnode(r) = u) as isStart",
      {
        userid,
      }
    );
    const relations: any[] = [];

    for (const rec of res.records) {
      const u2 = rec.get("u2").properties;
      const r = rec.get("r").properties;
      const isStart = rec.get("isStart");
      relations.push({
        to: {
          id: u2.id,
          name: u2.name,
        },
        amount: r.amount,
        role: isStart ? PRole.Debtor : PRole.Creditor,
      });
    }
    return relations;
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
    if (this.currentDebtor) {
    }
  }

  next() {
    this.nextCreditor();
    this.nextDebtor();
  }

  /**
   * @description seperates participants into 2 groups, debtors and creditors
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
      (a, b) => b.amount - a.amount
    );
    const debtors = Array.from(dmap.values()).sort(
      (a, b) => b.amount - a.amount
    );
    return { creditors, debtors };
  }
}

class ParticipantHandler {
  private iterator: ParticipantsIterator;
  private expense: IExpense;
  private participants: ParticipantExtended[];
  private total: number;
  private owes: { id: string; amount: number }[];
  constructor(expense: IExpense) {
    this.expense = expense;
    this.iterator = new ParticipantsIterator(expense);
    this.iterator.next();
    this.participants = [];
    this.total = 0;
    this.owes = [];
  }

  handle() {
    let pair = this.iterator.pair;
    let pairAmount = this.iterator.pairAmount;
    let lent = pair.c?.amount!;
    let borrowed = pair.d?.amount!;

    // if lent money is equal borrowed money cross each one
    if (Math.abs(lent - borrowed) < Number.EPSILON) {
      this.total += lent;
      this.owes.push({ id: pair.c!.id, amount: pair.c!.amount });
      this.participants.push({
        id: pair.d!.id,
        role: PRole.Debtor,
        amount: pairAmount!.d,
        owes: this.owes,
      });
      this.participants.push({
        id: pair.c!.id,
        role: PRole.Creditor,
        amount: pairAmount!.c,
      });

      this.iterator.next();
      // check this see if its necessary
      // if (creditor) creditortemp = creditor!.amount;
      // if (debtor) debtortemp = debtor!.amount;
      this.owes = [];
    }
    // if lent money is smaller that money borrowed cross
    // creditor but keep debtor to cross it next iterations
    // with one debtor
    else if (lent < borrowed) {
      this.total += pair.c!.amount;
      this.participants.push({
        id: pair.c!.id,
        role: PRole.Creditor,
        amount: pairAmount!.c,
      });
      this.owes.push({ id: pair.c!.id, amount: pair.c!.amount });

      pair.d!.amount -= pair.c!.amount;
      this.iterator.nextCreditor();
      // if (creditor) creditortemp = creditor!.amount;
    }
    // if money lent is bigger then corss one debtor and
    // hold creditor  to cross it with other debtors in
    // next iteration
    else {
      this.total += pair.d!.amount;
      this.owes.push({ id: pair.c!.id, amount: pair.d!.amount });
      this.participants.push({
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
    return Math.abs(this.total - this.expense.total) > Number.EPSILON;
  }
}

export { IExpense, Expense };
