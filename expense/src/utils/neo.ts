import neo4j, { Driver, QueryResult, Session } from "neo4j-driver";

export enum Nodes {
  Group = "Group",
  User = "User",
  Expense = "Expense",
  Payment = "Payment",
}

export enum Relations {
  Member = "MEMBER",
  Owner = "OWNER",
  Participate = "PARTICIPATE",
  Owe = "OWE",
  Paid = "Paid",
  Wrote = "WROTE",
  Assigned = "ASSIGNED",
}

/**
 * @description Encapsulating database interaction. Stuff like
 * creating indices, constraints, close, clear etc...
 */

class Graph {
  private _driver?: Driver;

  get driver() {
    if (!this._driver) throw new Error("Not connected to neo4j!");

    return this, this._driver;
  }

  async init(url: string, username: string, password: string) {
    this._driver = neo4j.driver(url, undefined, {
      disableLosslessIntegers: true,
    });
    const session = this.runMultiple();

    // create constraints
    await session.run(
      `CREATE CONSTRAINT U_UNIQUE IF NOT EXISTS ON (u:${Nodes.User}) ASSERT u.id IS UNIQUE`
    );
    await session.run(
      `CREATE CONSTRAINT EX_UNIQUE IF NOT EXISTS ON (e:${Nodes.Expense}) ASSERT e.id IS UNIQUE`
    );
    await session.run(
      `CREATE CONSTRAINT GP_UNIQUE IF NOT EXISTS ON (g:${Nodes.Group}) ASSERT g.id IS UNIQUE`
    );
    await session.run(
      `CREATE CONSTRAINT P_UNIQUE IF NOT EXISTS ON (p:${Nodes.Payment}) ASSERT p.id IS UNIQUE`
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

  async run(query: string, params: object): Promise<QueryResult> {
    const session = this.driver.session();
    try {
      const res = await session.run(query, params);
      await session.close();
      return res;
    } catch (err) {
      await session.close();
      console.log(err);
      console.log(`Query: ${query}`);
      throw err;
    } finally {
      await session.close();
    }
  }

  runMultiple(): QueryMultiple {
    return new QueryMultiple(this.driver);
  }

  async close() {
    await this.driver.close();
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

      return res.records[0].get("count") > 0;
    } catch (err) {
      console.log(err);
      await session.close();
    } finally {
      await session.close();
    }
  }
  async deleteNode(node: Nodes, id: string) {
    await this.run(
      `MATCH (n:${node} {id: $id}) 
       DELETE n`,
      {
        id,
      }
    );

    return true;
  }
  async deleteNodeWithRelations(node: Nodes, id: string) {
    await this.run(
      `MATCH (n:${node} {id: $id}) 
       DETACH DELETE n`,
      {
        id,
      }
    );

    return true;
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
      apoc.cypher.runMany('MATCH ()-[:PARTICIPATE]->(e) DETACH DELETE e;
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
}

/**
 * @description run multiple neo4j queries with one session
 */

class QueryMultiple {
  private session: Session;
  constructor(driver: Driver) {
    this.session = driver.session();
  }

  async run(query: string, params?: any) {
    try {
      const res = await this.session.run(query, params);
      return res;
    } catch (err) {
      console.log(err);
      console.log(`Query: ${query}`);
      throw err;
    }
  }

  async close() {
    await this.session.close();
  }
}

export const graph = new Graph();
