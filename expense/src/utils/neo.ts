import { BadRequestError } from "@chortec/common";
import neo4j, { Driver, Integer, QueryResult, Session } from "neo4j-driver";
import { v4 as uuid } from "uuid";

export enum Nodes {
  Group = "Group",
  User = "User",
  Expense = "Expense",
}

export enum Relations {
  Member = "MEMBER",
  Owner = "OWNER",
  Participate = "PARTICIPATE",
  Owe = "OWE",
  Wrote = "WROTE",
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

  async run(query: string, params: object): Promise<QueryResult> {
    const session = this.driver.session();
    try {
      const res = await session.run(query, params);
      await session.close();
      return res;
    } catch (err) {
      await session.close();
      console.log(err);
      throw err;
    } finally {
      await session.close();
    }
  }

  async close() {
    await this.driver.close();
  }
  /**
   *
   * @param eid expense id
   * @param uid writer id
   * @param comment the actual comment
   */

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
}

export const graph = new Graph();
