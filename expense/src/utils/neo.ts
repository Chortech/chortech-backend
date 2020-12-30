import { BadRequestError } from "@chortec/common";
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

export interface Expense {
  id: string;
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
  name?: string;
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
  async initSync(url: string, username: string, password: string) {
    while (true) {
      try {
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
        break;
      } catch (err) {
        await new Promise((res, rej) => setTimeout(res, 500));
        continue;
      }
    }
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

  /**
   *
   * @param id user id
   * @description returns details about who this user ows money
   * or need to get money from
   */
  async getExpenseReltaions(id: string) {
    const session = this.driver.session();

    try {
      const res = await session.run(
        "MATCH (u:User {id: $id})-[r:OWE]-(u2:User) RETURN u,r,u2, (startnode(r) = u) as isStart",
        {
          id,
        }
      );

      await session.close();

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
      MERGE (e:${Nodes.Expense} {id: $eid}) SET e= $expense WITH e
      UNWIND $participants as p
      WITH apoc.convert.toJson(p.owes) as owes , p, e
      MATCH (u:${Nodes.User} {id: p.id})
      MERGE (u)-[:${Relations.Participate} {role: p.role, amount: p.amount , owes: owes}]->(e)`,
        {
          expense: {
            id,
            creator: e.creator,
            total: e.total,
            group: e.group,
            notes: e.notes,
            paid_at: e.paid_at,
            created_at: e.created_at,
            modified_at: e.modified_at,
            description: e.description,
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
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async removeExpense(id: string) {
    const session = this.driver.session();
    try {
      const res = await session.run(
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
          id,
          role: PRole.Debtor,
        }
      );

      if (await this.deleteNode(Nodes.Expense, id)) {
        await session.close();
        return true;
      }
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }

    return false;
  }

  async updateExpense(e: Expense, hasChanged: boolean) {
    this.checkPriceFlow(e.participants, e.total);

    const session = this.driver.session();
    try {
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
            id: e.id,
            role: PRole.Debtor,
          }
        );

        // remove the old participant relations for this expense
        await session.run(
          `MATCH (u:${Nodes.User})-[r:${Relations.Participate}]-(e:${Nodes.Expense} {id: $id})
            DELETE r;`,
          {
            id: e.id,
            role: PRole.Debtor,
          }
        );

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
        // Find the expense and attach the updated participants to it
        console.log(participants);
        await session.run(
          `
        MATCH (e:${Nodes.Expense} {id: $eid}) SET e= $expense WITH e
        UNWIND $participants as p
        WITH apoc.convert.toJson(p.owes) as owes , p, e
        MATCH (u:${Nodes.User} {id: p.id})
        MERGE (u)-[:${Relations.Participate} {role: p.role, amount: p.amount , owes: owes}]->(e)`,
          {
            expense: {
              id: e.id,
              creator: e.creator,
              total: e.total,
              group: e.group,
              notes: e.notes,
              paid_at: e.paid_at,
              created_at: e.created_at,
              modified_at: e.modified_at,
              description: e.description,
            },
            participants: participants,
            eid: e.id,
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

        // await this.addExpense(e);
      } else {
        await session.run(
          `
        MATCH (e:${Nodes.Expense} {id: $eid}) SET e= $expense RETURN e`,
          {
            expense: {
              id: e.id,
              creator: e.creator,
              total: e.total,
              group: e.group,
              notes: e.notes,
              paid_at: e.paid_at,
              created_at: e.created_at,
              modified_at: e.modified_at,
              description: e.description,
            },
            eid: e.id,
          }
        );
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async deleteNode(node: Nodes, id: string) {
    const session = this.driver.session();
    try {
      const res = await session.run(
        `MATCH (n:${node} {id: $id}) 
         DETACH DELETE n`,
        {
          id,
        }
      );
      await session.close();

      return true;
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }

    return false;
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
  async clearExpectUsers() {
    const session = this.driver.session();
    try {
      await session.run(`
      apoc.chypher.runMany('MATCH ()-[:PARTICIPATE]->(e) DETACH DELETE e;
      MATCH (e:Expense) DETACH DELETE e;
      MATCH ()-[r:OWE]-() DETACH DELETE r;' , {}); `);
    } catch (err) {
      console.log(err);
      await session.close();
      throw err;
    } finally {
      await session.close();
    }
  }

  private checkPriceFlow(participants: Participant[], expensePrice: number) {
    if (participants.length === 0)
      throw new BadRequestError("Expense must have at least one Participant!");

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
      throw new BadRequestError(
        "Amount received must be eqaul to amount paid!"
      );
    }
  }
  private seperateParticipants(e: Expense) {
    const cmap = new Map<string, Participant>();
    const dmap = new Map<string, Participant>();

    for (const p of e.participants) {
      if (p.role === PRole.Creditor) cmap.set(p.id, p);
      else dmap.set(p.id, p);
    }

    cmap.forEach((c) => {
      if (dmap.has(c.id)) {
        const d = dmap.get(c.id)!;
        if (Math.abs(c.amount - d.amount) < Number.EPSILON) {
          e.total -= d.amount;
          dmap.delete(d.id);
          cmap.delete(c.id);
          // if creditor is bigger subtract debtor from it and remove debtor
        } else if (c.amount > d.amount) {
          e.total -= d.amount;
          c.amount -= d.amount;
          dmap.delete(d.id);
          // if debtor is bigger subtract creditor from it and remove creditor
        } else {
          e.total -= c.amount;
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

export const graph = new Graph();
