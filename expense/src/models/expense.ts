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
  category: number;
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
          category: expense.category,
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
    // delete the prev group relation
    await Expense.deleteExpenseGroup(expenseid);

    // assign the new group to this expense
    await graph.run(
      `
      MATCH (e:${Nodes.Expense} {id: $expenseid}),(g:${Nodes.Group} {id: $groupid})
      CREATE (e)-[:${Relations.Assigned}]->(g);
      `,
      { groupid, expenseid }
    );

    return true;
  }

  static async updateInfo(expense: IExpense) {
    // remove old relation if participants changed
    // and then calculate new relations and update expense
    await graph.run(
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
          category: expense.category,
        },
        eid: expense.id,
      }
    );

    if (expense.group) {
      Expense.updateGroup(expense.group, expense.id);
    }
  }

  static async updateFull(expense: IExpense) {
    await Expense.remove(expense.id);
    return await Expense.create(expense);
  }

  static async remove(expenseid: string) {
    await graph.run(
      `MATCH ()-[r:${Relations.Owe} {eid: $expenseid}]-()
       DELETE r;`,
      {
        expenseid,
      }
    );

    // delete expense node and participate relations
    await graph.deleteNodeWithRelations(Nodes.Expense, expenseid);
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
      `MATCH (u:${Nodes.User})-[:${Relations.Member}]->(g:${Nodes.Group} {id: $groupid})
      CALL{
        WITH u,g
          MATCH (u)-[r:${Relations.Owe}]-(u2:${Nodes.User})
          WHERE (u2)-[:${Relations.Member}]->(g)
          RETURN sum(CASE WHEN startNode(r) = u THEN -r.amount ELSE r.amount END) as balance, u2
      }
      RETURN properties(u) as user, collect({ user: properties(u2), balance: balance}) as balances
      `,
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
      `MATCH (u:${Nodes.User} {id: $userid})
        -[r:${Relations.Owe}]-(u1:${Nodes.User})
        RETURN properties(u) as user, properties(u1) as other, 
          sum(CASE WHEN startNode(r) = u THEN -r.amount ELSE r.amount END) as balance;
      `,
      {
        userid,
      }
    );
    const relations: any[] = [];

    for (const rec of res.records) {
      relations.push({
        self: rec.get("user"),
        other: rec.get("other"),
        balance: rec.get("balance"),
      });
    }
    return relations;
  }

  /**
   * @description returns all the expenses between a user and Associates
   * @param userid user id
   */

  static async findAssociateExpensesByUserid(
    userid: string,
    associateid: string
  ) {
    const res = await graph.run(
      `MATCH (u:${Nodes.User} {id: $userid})-[:${Relations.Participate}]->
      (e:${Nodes.Expense})<-[:${Relations.Participate}]-(u1:${Nodes.User} {id: $associateid})
      CALL{
        WITH e,u,u1
          MATCH (u)-[r:${Relations.Owe} {eid: e.id}]-(u1)
          RETURN {
            expense: properties(e),
            balance:sum(CASE WHEN startNode(r) = u THEN -r.amount ELSE r.amount END)
          } as expense
      }
      RETURN properties(u) as user, properties(u1) as other, collect(expense) as expenses
      `,
      { userid, associateid }
    );

    const expenses: any[] = [];

    for (const rec of res.records) {
      expenses.push({
        self: rec.get("user"),
        other: rec.get("other"),
        expenses: rec.get("expenses"),
      });
    }
    return expenses;
  }
}

export { IExpense, Expense };
