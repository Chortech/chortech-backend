import { graph, Nodes, Relations } from "../utils/neo";
import { IParticipant, ParticipantHandler, PRole } from "./participant";
import { v4 as uuid } from "uuid";
import { Comment, IComment } from "./comment";
import { Group, IGroup } from "./group";
import { IUser } from "./user";
import util from "util";
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
    expense.id = expense.id ? expense.id : uuid();
    // Create the expense and attach the participants to it
    await session.run(
      `MERGE (e:${Nodes.Expense} {id: $expenseid}) SET e= $expense WITH e
      UNWIND $participants as p
      WITH p, e
      MATCH (u:${Nodes.User} {id: p.id})
      MERGE (u)-[:${Relations.Participate} {role: p.role, amount: p.amount}]->(e)`,
      {
        expense: {
          id: expense.id,
          creator: expense.creator,
          total: expense.total,
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

    // handle owe relations between participants
    await session.run(
      `UNWIND $participants AS p
       MATCH (u:User {id: p.id})
       CALL {
        WITH p , u
        UNWIND p.owes as o
        MATCH (u2:User {id: o.id})
        CREATE (u)-[:OWE {eid: $eid , amount: o.amount}]->(u2)
        RETURN NULL
       }
       RETURN NULL`,
      { participants, eid: expense.id }
    );

    await session.close();

    return expense.id;
  }

  static async deleteExpenseGroup(expenseid: string) {
    await graph.run(
      `MATCH (:${Nodes.Expense} {id: $expenseid})
      -[r:${Relations.Assigned}]->
        (:${Nodes.Group})
      DELETE r;
      `,
      { expenseid }
    );
  }

  static async updateGroup(groupid: string, expenseid: string) {
    const session = graph.runMultiple();
    // delete the prev group relation
    await Expense.deleteExpenseGroup(expenseid);

    // assign the new group to this expense
    await session.run(
      `
      MATCH (e:${Nodes.Expense} {id: $expenseid}),(g:${Nodes.Group} {id: $groupid})
      CREATE (e)-[:${Relations.Assigned}]->(g);
      `,
      { groupid, expenseid }
    );

    return true;
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
    await Expense.remove(expense.id);
    return await Expense.create(expense);
  }

  static async remove(expenseid: string) {
    const session = graph.runMultiple();
    await session.run(
      `MATCH ()-[r:${Relations.Owe} {eid: $expenseid}]-()
       DELETE r;`,
      {
        expenseid,
      }
    );

    // delete expense node and participate relations
    await graph.deleteNodeWithRelations(Nodes.Expense, expenseid);
    await session.close();
    return true;
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
   * @description find balance of user with id userid in all groups
   * @param userid user id
   */
  static async findGroupsExpense(
    userid: string
  ): Promise<
    {
      group: IGroup;
      balance: number;
      expenses: { expense: IExpense; amount: number }[];
    }[]
  > {
    const res = await graph.run(
      `MATCH (u:${Nodes.User} {id: $userid})-[:${Relations.Member}]->(g:${Nodes.Group})
      CALL {
        WITH g,u
        MATCH (g)<-[:${Relations.Assigned}]-(e:${Nodes.Expense})<-[r:${Relations.Participate}]-(u)
          RETURN collect({expense: properties(e), amount: CASE r.role WHEN "debtor" then -r.amount else r.amount end}) as expenses,
          sum(CASE r.role WHEN "debtor" then -r.amount else r.amount end) as balance
      }
      RETURN properties(g) as group, balance, expenses
      `,
      { userid }
    );

    const result: {
      group: IGroup;
      balance: number;
      expenses: { expense: IExpense; amount: number }[];
    }[] = [];
    for (const rec of res.records) {
      let group = rec.get("group");
      delete group.members;
      result.push({
        group: group,
        expenses: rec.get("expenses"),
        balance: rec.get("balance"),
      });
    }

    return result;
  }

  /**
   * @description find all balances of group with id groupid
   * this is used in get group balances route
   * @param userid user id
   */

  static async findGroupBalanceByGroupid(
    groupid: string
  ): Promise<
    {
      user: IUser;
      balances: { user: IUser; amount: number };
    }[]
  > {
    const res = await graph.run(
      `MATCH (g:${Nodes.Group} {id: $groupid})
      WITH g
      MATCH (u1:${Nodes.User})-[:${Relations.Member}]->(g)
      CALL {
        WITH u1,g
        MATCH (g)<-[:${Relations.Member}]-(u2:${Nodes.User})-[r:${Relations.Owe}]-(u1)
          WHERE u1 <> u2
          RETURN collect({
            user: properties(u2),
            amount: CASE WHEN startnode(r) = u1 THEN -r.amount ELSE r.amount END
        }) as balances
      }
      RETURN properties(u1) as user , balances`,
      { groupid }
    );

    const balances: {
      user: IUser;
      balances: { user: IUser; amount: number };
    }[] = [];

    for (const rec of res.records) {
      balances.push({
        user: rec.get("user"),
        balances: rec.get("balances"),
      });
    }

    return balances;
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
        amount: isStart ? -r.amount : r.amount,
      });
    }
    return relations;
  }

  /**
   * @description returns all the expenses between a user and Associates
   * @param userid user id
   */

  static async findAssociatesExpenseByUserid(
    userid: string,
    associateid: string
  ) {
    const res = await graph.run(
      `MATCH (u:${Nodes.User} {id: $userid})-[r:${Relations.Participate}]->
      (e:${Nodes.Expense})<-[r2:${Relations.Participate}]-(User: )
      `,
      { userid, associateid }
    );
  }
}

export { IExpense, Expense };
