import { graph, Nodes, Relations } from "../utils/neo";
import { IParticipant, ParticipantHandler, PRole } from "./participant";
import { v4 as uuid } from "uuid";
import { BadRequestError } from "@chortec/common";
import { Comment, IComment } from "./comment";
import util from "util";
import { Group } from "./group";

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

class Expense {
  static async exists(expenseid: string) {
    return await graph.exists(Nodes.Expense, expenseid);
  }

  static async create(expense: IExpense) {
    const session = graph.runMultiple();

    const handler = new ParticipantHandler(expense);
    while (handler.satisfied()) {
      handler.handle();
    }
    const participants = handler.participants;
    console.log(
      util.inspect(participants, false, null, true /* enable colors */)
    );
    expense.id = uuid();
    // Create the expense and attach the participants to it
    await session.run(
      `MERGE (e:${Nodes.Expense} {id: $expenseid}) SET e= $expense WITH e
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
        expenseid: expense.id,
      }
    );

    // assign this expense to the group
    if (expense.group) await Group.assignExpense(expense.group, expense.id);

    await session.run(
      `UNWIND $participants AS p
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

    return expense.id;
  }

  static async updateInfo(expense: IExpense) {
    const session = graph.runMultiple();
    // remove old relation if participants changed
    // and then calculate new relations and update expense
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

    await session.close();
  }

  static async updateFull(expense: IExpense) {
    const session = graph.runMultiple();
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

    const handler = new ParticipantHandler(expense);
    while (handler.satisfied()) {
      handler.handle();
    }
    const participants = handler.participants;

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
  }

  static async remove(expenseid: string) {
    const session = graph.runMultiple();
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

    if (res.records.length === 0) return null;

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

export { IExpense, Expense };
