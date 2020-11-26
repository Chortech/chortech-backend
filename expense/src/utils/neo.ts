import neo4j, { Driver } from "neo4j-driver";
import { v4 as uuid } from "uuid";

enum Nodes {
  Group = "Gruop",
  User = "User",
  Expense = "Expense",
}

enum Relations {
  Member = "MEMBER",
  Owner = "OWNER",
  Participate = "PARTICIPATE",
  Paid = "PAID",
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
  id: string;
  description: string;
  participants: Participant[];
  price: number;
  comments?: Comment[];
  group?: string;
  notes?: string;
  paid_at: number;
  created_at: number;
  modified_at: number;
}

interface Participant {
  id: string;
  amount: number;
  role: PRole;
}

enum PRole {
  Debtor = "debtor",
  Creditor = "creditor",
}

interface Comment {
  writer: string;
  created_at: number;
  text: string;
}

class Graph {
  private _driver?: Driver;

  get driver() {
    if (!this._driver) throw new Error("Not connected to neo4j!");

    return this, this._driver;
  }

  async init(url: string, username: string, password: string) {
    this._driver = neo4j.driver(url, neo4j.auth.basic(username, password));
    // const session = this.driver.session();
    // await session.run(
    //   `CREATE CONSTRAINT U_UNIQUE IF NOT EXISTS ON (u:${Nodes.User}) ASSERT u.id IS UNIQUE;
    //   CREATE CONSTRAINT EX_UNIQUE IF NOT EXISTS ON (e:${Nodes.Expense}) ASSERT e.id IS UNIQUE;
    //   CREATE CONSTRAINT GP_UNIQUE IF NOT EXISTS ON (g:${Nodes.Group}) ASSERT g.id IS UNIQUE`
    // );

    // await session.close();
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
      session.run;
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
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }
  }

  async addExpense(e: Expense) {
    if (e.participants.length === 0)
      throw new Error("Expense must have at least one Participant!");

    const paid = e.participants
      .filter((p) => p.role === PRole.Creditor)
      .map((p) => p.amount)
      .reduce((a, b) => a + b, 0);

    const received = e.participants
      .filter((p) => p.role === PRole.Debtor)
      .map((p) => p.amount)
      .reduce((a, b) => a + b, 0);

    if (
      Math.abs(paid - received) > Number.EPSILON || // if paid and received are not equal
      Math.abs(paid - e.price) > Number.EPSILON || // if paid and expense price are not equal
      Math.abs(received - e.price) > Number.EPSILON // if received and expense price are not equal
    ) {
      console.log(
        Math.abs(paid - received),
        Math.abs(paid - e.price),
        Math.abs(received - e.price),
        Number.EPSILON
      );
      throw new Error("Amount received must be eqaul to amount paid!");
    }

    const session = this.driver.session();
    // let creditor = e.creditors.pop();
    // let debtor = e.creditors.pop();
    try {
      // Create the expense and attach the participants to it
      await session.run(
        `MERGE (e:${Nodes.Expense} {id: $eid}) ON CREATE SET e= $expense WITH e as expense
      UNWIND $participants as p
      MATCH (u:${Nodes.User} {id: p.id})
      MERGE (u)-[:PARTICIPATE {role: p.role, amount: p.amount}]->(expense);`,
        {
          expense: {
            price: e.price,
            comments: e.comments,
            group: e.group,
            notes: e.notes,
            paid_at: e.paid_at,
            created_at: e.created_at,
            modified_at: e.modified_at,
            description: e.description,
          },
          participants: e.participants,
          eid: e.id,
        }
      );

      let total = 0;
      const creditors = e.participants
        .filter((p) => p.role === PRole.Creditor)
        .sort((a, b) => b.amount - a.amount);
      const debtors = e.participants
        .filter((p) => p.role === PRole.Debtor)
        .sort((a, b) => b.amount - a.amount);
      // console.log(creditors, debtors);

      let creditor = creditors.pop();
      let debtor = debtors.pop();
      console.log(
        Math.abs(total - e.price),
        Math.abs(total - e.price) > Number.EPSILON
      );
      const query = `MATCH (c:${Nodes.User} {id: $cid})
      MATCH (d:${Nodes.User} {id: $did})
      WITH c,d
      MERGE (c)-[r:${Relations.Paid}]->(d)
      ON CREATE SET r.amount = $amount
      ON MATCH  SET r.amount = r.amount + $amount`;

      while (Math.abs(total - e.price) > Number.EPSILON) {
        console.log("Hello");
        let lent = creditor!.amount;
        let borrowed = debtor!.amount;
        if (Math.abs(lent - borrowed) < Number.EPSILON) {
          // If equal cross one creditor with one debtor
          total += creditor!.amount;

          // Create The relation
          await session.run(query, {
            cid: creditor?.id,
            did: debtor?.id,
            amount: creditor?.amount,
          });
          creditor = creditors.pop();
          debtor = debtors.pop();
        } else if (lent < borrowed) {
          // If borrowed money is bigger cross creditor and keep debtor
          total += creditor!.amount;

          await session.run(query, {
            cid: creditor?.id,
            did: debtor?.id,
            amount: creditor?.amount,
          });
          debtor!.amount -= creditor!.amount;
          creditor = creditors.pop();
        } else {
          // If borrowed money is samller cross debtor and keep debtor
          total += debtor!.amount;

          await session.run(query, {
            cid: creditor?.id,
            did: debtor?.id,
            amount: debtor?.amount,
          });
          creditor!.amount -= debtor!.amount;
          debtor = debtors.pop();
        }
      }
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
}

export const graph = new Graph();

(async function name() {
  await graph.init("bolt://localhost:7687", "neo4j", "123456789");

  await graph.clear();
  await graph.createUser("1", "Sina");
  await graph.createUser("2", "Nima");
  await graph.createUser("3", "Babak");
  await graph.createUser("4", "Hazhar");
  await graph.addExpense({
    id: "2",
    description: "Expense 1",
    price: 10,
    paid_at: Math.floor(Date.now() / 1000),
    created_at: Math.floor(Date.now() / 1000),
    modified_at: Math.floor(Date.now() / 1000),
    participants: [
      { id: "1", role: PRole.Creditor, amount: 7 },
      { id: "2", role: PRole.Creditor, amount: 3 },
      { id: "4", role: PRole.Debtor, amount: 10 },
    ],
  });

  await graph.close();
})();

// MATCH (e:Expense {id: "1"})
// UNWIND [{id:"1" , amount:12} , {id:"12", amount:13}] as list
// MATCH (u:User {id: list.id})
// MERGE (u)-[:PARTICIPATE {role: "debtor", amount: list.amount}]->(e)
