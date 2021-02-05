import { graph, Nodes, Relations } from "../utils/neo";
import { IParticipant, ParticipantHandler, PRole } from "./participant";
import { v4 as uuid } from "uuid";
import { Comment, IComment } from "./comment";
import { Group, IGroup } from "./group";
import { IUser, User } from "./user";
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
    return await graph.exists(Nodes.Expense, [expenseid]);
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
      `MERGE (e:${Nodes.Expense} {id: $expenseid, created_at: timestamp()}) SET e+= $expense WITH e
      UNWIND $participants as p
      WITH p, e
      MATCH (u:${Nodes.User} {id: p.id})
      MERGE (u)-[:${Relations.Participate} 
        {amount: CASE p.role WHEN "debtor" then -p.amount else p.amount end}]->(e)`,
      {
        expense: {
          id: expense.id,
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

    await User.assginCreator(Nodes.Expense, expense.id, expense.creator);

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
        CREATE (u)-[:OWE {id: $eid , amount: o.amount}]->(u2)
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
      `MATCH ()-[r:${Relations.Owe} {id: $expenseid}]-()
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
      `MATCH (u:${Nodes.User})-
      [r:${Relations.Participate}]
      ->(e:${Nodes.Expense} {id: $expenseid}) 
      CALL {
      	WITH e
        OPTIONAL MATCH (e)-[:ASSIGNED]->(g:Group)
        RETURN g
      }
      RETURN 
        apoc.map.merge(
          properties(e), 
          {
            group: properties(g),
            participants: collect(
              apoc.map.merge(properties(u), 
              {balance: r.amount})
            )
          }
        ) as expense`,
      {
        expenseid,
      }
    );

    return res.records.length !== 0
      ? {
          ...res.records[0].get("expense"),
          comments: await Comment.findByTargetId(Nodes.Expense, expenseid),
        }
      : null;
  }

  static async findByUserId(userid: string) {
    const res = await graph.run(
      `MATCH (:${Nodes.User} {id: $uid})-[r:${Relations.Participate}]->(e:${Nodes.Expense}) 
      RETURN collect(apoc.map.merge(properties(e) ,{balance: properties(r).amount})) as expenses`,
      {
        uid: userid,
      }
    );

    return res.records.length !== 0 ? res.records[0].get("expenses") : null;
  }
}

export { IExpense, Expense };
