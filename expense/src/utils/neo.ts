import neo4j, { Driver, Integer, Session } from "neo4j-driver";
import { v4 as uuid } from "uuid";

export enum Nodes {
  Group = "Gruop",
  User = "User",
  Expense = "Expense",
}

enum Relations {
  Member = "MEMBER",
  Owner = "OWNER",
  Participate = "PARTICIPATE",
  Owe = "OWE",
  Wrote = "WROTE",
}

interface User {
  name: string;
  id: string;
}

interface Group {
  name: string;
  id: string;
}

interface Expense {
  id?: string;
  creator: string;
  description: string;
  participants: Participant[];
  total: number;
  comments?: Comment[];
  group?: string;
  notes?: string;
  paid_at: number;
  created_at: number;
  modified_at: number;
}

export interface Participant {
  id: string;
  amount: number;
  role: PRole;
}
type ParticipantExtended =
  | Participant
  | (Participant & {
      role: PRole.Debtor;
      owes: { id: string; amount: number }[];
    });
export enum PRole {
  Debtor = "debtor",
  Creditor = "creditor",
}

interface Comment {
  id: string;
  created_at: number; // when the comment was written
  text: string; // text of the comment
}

class Graph {
  private _driver?: Driver;

  get driver() {
    if (!this._driver) throw new Error("Not connected to neo4j!");

    return this, this._driver;
  }

  async init(url: string, username: string, password: string) {
    this._driver = neo4j.driver(url);
    const session = this.driver.session();
    await session.run(
      `CREATE CONSTRAINT U_UNIQUE IF NOT EXISTS ON (u:${Nodes.User}) ASSERT u.id IS UNIQUE`
    );
    await session.run(
      `CREATE CONSTRAINT EX_UNIQUE IF NOT EXISTS ON (e:${Nodes.Expense}) ASSERT e.id IS UNIQUE`
    );
    await session.run(
      `CREATE CONSTRAINT GP_UNIQUE IF NOT EXISTS ON (g:${Nodes.Group}) ASSERT g.id IS UNIQUE`
    );

    await session.close();
  }

  private async installUUID(label: Nodes) {
    const session = this.driver.session();

    try {
      await session.run(
        `CALL apoc.uuid.install($label, {addToExistingNodes: true, uuidProperty: 'id'}) 
        yield label, installed, properties`,
        {
          label,
        }
      );
      await session.close();
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }
  }

  async close() {
    await this.driver.close();
  }
  async createUser(id: string, name: string) {
    const session = this.driver.session();

    try {
      const res = await session.run("CREATE (:User {id: $id , name: $name })", {
        id,
        name,
      });
      await session.close();
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }
  }

  /**
   *
   * @param eid expense id
   * @param uid writer id
   * @param comment the actual comment
   */

  async addComment(eid: string, uid: string, comment: Comment) {
    const session = this.driver.session();

    try {
      const res = await session.run(
        `MATCH (u:User {id: $uid})-[:PARTICIPATE]->(e:Expense {id: $eid})
        CREATE (u)-[r:WROTE]->(e)
        SET r = $comment
        RETURN e,u`,
        {
          uid,
          eid,
          comment,
        }
      );
      await session.close();
      return res.records.length;
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }
  }

  // TODO handle the case that user does not belong in this expense
  async getComments(eid: string) {
    const session = this.driver.session();

    try {
      const res = await session.run(
        `MATCH (e:${Nodes.Expense} {id: $eid})<-[comments:${Relations.Wrote}]-(u:${Nodes.User})
        RETURN u ,comments`,
        {
          eid,
        }
      );
      const comments: any[] = [];
      for (const rec of res.records) {
        let u = rec.get("u").properties;
        let c = rec.get("comments").properties;

        c.writer = { id: u.id, name: u.name };
        comments.push(c);
      }
      await session.close();
      return comments;
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }
  }

  async exists(node: Nodes, id: string) {
    const session = this.driver.session();

    try {
      const res = await session.run(
        `MATCH (n:${node} {id: $id})
        RETURN count(n) as count`,
        {
          id,
        }
      );

      await session.close();

      return (res.records[0].get("count") as Integer).toNumber() > 0;
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }
  }

  async getExpenses(user: string) {
    const session = this.driver.session();

    try {
      const res = await session.run(
        "MATCH (:User {id: $uid})-[r:PARTICIPATE]->(e:Expense) RETURN e,r",
        {
          uid: user,
        }
      );

      await session.close();

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
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }
  }
  async getExpense(expense: string) {
    const session = this.driver.session();

    try {
      const res = await session.run(
        "MATCH (u:User)-[r:PARTICIPATE]->(e:Expense {id: $eid}) RETURN *",
        {
          eid: expense,
        }
      );

      await session.close();

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
        comments: await this.getComments(expense),
      };
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }
  }

  async createGroup(group: Group, owner: User) {
    const session = this.driver.session();
    try {
      await session.run(
        `CREATE (o:User {uid:$uid,uname:$uname}), (g:Group {gid:$uid, gname:$gname})
          CREATE (o)-[r:MEMBER]->(g)<-[:OWNER]-(o)`,
        {
          uid: owner.id,
          gid: group.id,
          uname: owner.id,
          gname: group.name,
        }
      );
      await session.close();
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }
  }
  async addMember(id: string, user: User) {
    const session = this.driver.session();
    try {
      await session.run(
        `MATCH (g:Group {id: $id}) , (u:User {id: $user}) CREATE (u)-[:MEMBER]->(g)`,
        {
          id,
          user: user.id,
        }
      );
      await session.close();
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }
  }

  async countParticipants(p: Participant[]) {
    const session = this.driver.session();
    try {
      const res = await session.run(
        `UNWIND $participants as p
        MATCH (u:User {id: p.id})
        RETURN COUNT(u) as count`,
        {
          participants: p,
        }
      );
      await session.close();
      let count = res.records[0].get("count") as Integer;
      return count.toNumber();
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }
  }

  async addExpense(e: Expense) {
    // Check if the expense,paid and received amount are equal
    this.checkPriceFlow(e.participants, e.total);

    const session = this.driver.session();
    try {
      let total = 0;
      const { creditors, debtors } = this.seperateParticipants(e);
      let creditor = creditors.pop();
      let debtor = debtors.pop();
      const participants: ParticipantExtended[] = [];
      let owes: { id: string; amount: number }[] = new Array();
      let creditortemp = creditor!.amount;
      let debtortemp = debtor!.amount;
      while (Math.abs(total - e.total) > Number.EPSILON) {
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
      CREATE (e:${Nodes.Expense}) SET e= $expense WITH e
      UNWIND $participants as p
      WITH apoc.convert.toJson(p.owes) as owes , p, e
      MATCH (u:${Nodes.User} {id: p.id})
      MERGE (u)-[:${Relations.Participate} {role: p.role, amount: p.amount , owes: owes}]->(e)`,
        {
          expense: {
            id,
            creator: e.creator,
            price: e.total,
            comments: e.comments,
            group: e.group,
            notes: e.notes,
            paid_at: e.paid_at,
            created_at: e.created_at,
            modified_at: e.modified_at,
            description: e.description,
          },
          participants: participants,
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

      return id;
    } catch (err) {
      console.log(err);
    }
  }

  async clear() {
    const session = this.driver.session();
    try {
      await session.run(`MATCH (n) DETACH DELETE n`);
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }
  }

  private checkPriceFlow(participants: Participant[], expensePrice: number) {
    if (participants.length === 0)
      throw new Error("Expense must have at least one Participant!");

    const paid = participants
      .filter((p) => p.role === PRole.Creditor)
      .map((p) => p.amount)
      .reduce((a, b) => a + b, 0);

    const received = participants
      .filter((p) => p.role === PRole.Debtor)
      .map((p) => p.amount)
      .reduce((a, b) => a + b, 0);

    if (
      Math.abs(paid - received) > Number.EPSILON || // if paid and received are not equal
      Math.abs(paid - expensePrice) > Number.EPSILON || // if paid and expense price are not equal
      Math.abs(received - expensePrice) > Number.EPSILON // if received and expense price are not equal
    ) {
      throw new Error("Amount received must be eqaul to amount paid!");
    }
  }
  private seperateParticipants(e: Expense) {
    const creditors = e.participants
      .filter((p) => p.role === PRole.Creditor)
      .sort((a, b) => b.amount - a.amount);
    const debtors = e.participants
      .filter((p) => p.role === PRole.Debtor)
      .sort((a, b) => b.amount - a.amount);

    for (let creditor of creditors) {
      for (let debtor of debtors) {
        if (debtor.id === creditor.id) {
          let index = debtors.indexOf(debtor);
          e.total -= debtor.amount;
          creditor.amount -= debtor.amount;
          debtors.splice(index, 1);
        }
      }
    }

    return { creditors, debtors };
  }
  private async handleExpenseRelation(
    session: Session,
    creditorId: string,
    debtorId: string,
    amount: number
  ) {
    const result = await session.run(
      `MATCH (:${Nodes.User} {id: $u1})-[o:OWE]-(u:${Nodes.User} {id: $u2})
    RETURN (startNode(o) = u) as isStart , o as rel`,
      {
        u1: creditorId,
        u2: debtorId,
      }
    );
    if (result.records[0]) {
      const isStart = result.records[0].get("isStart");
      // console.log(isStart);
      if (isStart === true) {
        // Just add to the existing relation
        await session.run(
          `MATCH (c:${Nodes.User} {id: $cid})
        MATCH (d:${Nodes.User} {id: $did})
        WITH c,d
        MERGE (c)<-[r:${Relations.Owe}]-(d)
        ON CREATE SET r.amount = $amount
        ON MATCH  SET r.amount = r.amount + $amount`,
          {
            cid: creditorId,
            did: debtorId,
            amount,
          }
        );
      } else if (isStart === false) {
        // Subtract From Current amount
        const currentAmount = result.records[0].get("rel").properties.amount;
        const diff = currentAmount - amount;
        console.log("diff", diff);
        // if its negative change dirrection
        // else just subtract from existing relation
        if (diff < 0) {
          await session.run(
            `MATCH (u:${Nodes.User} {id: $u1})-[o:OWE]-(:${Nodes.User} {id: $u2})
          CALL apoc.refactor.invert(o)
          YIELD input, output
          SET output.amount = $diff`,
            {
              diff: -diff,
              u1: creditorId,
              u2: debtorId,
            }
          );
        } else if (diff > 0) {
          await session.run(
            `MATCH (u:${Nodes.User} {id: $u1})-[o:OWE]-(:${Nodes.User} {id: $u2})
             SET o.amount = $diff`,
            {
              diff: diff,
              u1: creditorId,
              u2: debtorId,
            }
          );
        } else {
          // Delete The relation
          await session.run(
            `MATCH (u:${Nodes.User} {id: $u1})-[o:OWE]-(:${Nodes.User} {id: $u2})
          DELETE o`,
            {
              u1: creditorId,
              u2: debtorId,
            }
          );
        }
      }
    } else {
      // if isStart is undefined create the relation
      await session.run(
        `MATCH (c:${Nodes.User} {id: $cid})
      MATCH (d:${Nodes.User} {id: $did})
      WITH c,d
      MERGE (c)<-[r:${Relations.Owe}]-(d)
      ON CREATE SET r.amount = $amount
      ON MATCH  SET r.amount = r.amount + $amount`,
        {
          cid: creditorId,
          did: debtorId,
          amount,
        }
      );
    }
  }
}

export const graph = new Graph();
