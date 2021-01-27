import { graph, Nodes, Relations } from "../utils/neo";
import { Comment, IComment } from "./comment";
import { v4 as uuid } from "uuid";
import { Group } from "./group";
import { IUser } from "./user";

const NO_GROUP = "no-group";

interface IPayment {
  id: string;
  from: string;
  to: string;
  creator: string;
  amount: number;
  paid_at: number;
  group?: string;
  notes?: string;
  comments?: IComment[];
}

class Payment {
  static async exists(ids: string) {
    return await graph.exists(Nodes.Payment, [ids]);
  }

  static async create(payment: IPayment) {
    const session = graph.runMultiple();
    payment.id = payment.id ? payment.id : uuid();

    // create payment node and participate relations
    await session.run(
      `CREATE (p:Payment {id: $paymentid}) SET p+= $payment
      WITH p
      MATCH (from:User {id: p.from}), (to:User {id: p.to})
      CREATE (from)-[r1:PARTICIPATE {amount: p.amount}]->(p)<-[r2:PARTICIPATE {amount: -p.amount}]-(to)
      RETURN r1,r2
			`,
      {
        payment: {
          from: payment.from,
          to: payment.to,
          amount: payment.amount,
          paid_at: payment.paid_at,
          notes: payment.notes,
          creator: payment.creator,
        },
        paymentid: payment.id,
      }
    );

    // create paid relations
    await session.run(
      `WITH $payment as p
			MATCH (from:User {id: p.from}), (to:User {id: p.to})
			CREATE (from)-[r:PAID {pid: p.id, amount: p.amount}]->(to)
			RETURN r;
			`,
      { payment }
    );

    if (payment.group) await Group.assignPayment(payment.group, payment.id);

    session.close();
    return payment.id;
  }
  static async remove(paymentid: string) {
    // remove paid relations
    await graph.run(
      `MATCH (p:Payment {id: $paymentid})
			WITH p
			MATCH (:User {id: p.from})-[r:PAID]->(:User {id: p.to})
			DELETE r;
			`,
      { paymentid }
    );

    // remove the payment and its participate relations
    return await graph.deleteNodeWithRelations(Nodes.Payment, paymentid);
  }

  static async deletePaymentGroup(paymentid: string) {
    await graph.run(
      `MATCH (:${Nodes.Payment} {id: $paymentid})
      -[r:${Relations.Assigned}]->
        (:${Nodes.Group})
      DELETE r;
      `,
      { paymentid }
    );
  }
  static async update(payment: IPayment) {
    const session = graph.runMultiple();

    // you cant change the users keep that in mind :)
    // update the group first
    if (payment.group) {
      // delete the assign relations anyways
      await Payment.deletePaymentGroup(payment.id);

      // now if group value is not no-group update it otherwise don't change anything
      if (payment.group !== NO_GROUP) {
        await Group.assignPayment(payment.group, payment.id);
      }

      delete payment.group;
    }

    if (payment.amount) {
      // update amount for paid relations
      await session.run(
        `MATCH ()-[r:PAID {pid: $paymentid}]->()
        SET r.amount = $amount
        RETURN r;
        `,
        { paymentid: payment.id, amount: payment.amount }
      );

      // update amount for participate relations
      await session.run(
        `UNWIND $ids as id
        MATCH (:User {id: id})-[r:PARTICIPATE]->(:Payment {id: $paymentid})
        SET r.amount= CASE WHEN r.amount >= 0 THEN $amount ELSE -$amount END;
        `,
        {
          ids: [payment.from, payment.to],
          paymentid: payment.id,
          amount: payment.amount,
        }
      );
    }
    // update the payment node
    await session.run(
      `WITH $payment as p
        MATCH (e:${Nodes.Payment} {id: p.id}) SET e+= p RETURN p`,
      {
        payment,
      }
    );

    session.close();
  }
  static async findById(
    paymentid: string
  ): Promise<{
    id: string;
    from: IUser;
    to: IUser;
    creator: string;
    amount: number;
    paid_at: number;
    group?: string;
    notes?: string;
    comments?: IComment[];
  }> {
    const res = await graph.run(
      `MATCH (u:User)-[p1:PARTICIPATE]->(p:Payment {id: $paymentid})<-[p2:PARTICIPATE]-(u1:User)
      RETURN properties(p) as payment, 
      CASE WHEN p1.amount > 0 THEN properties(u) ELSE properties(u1) END AS from,
      CASE WHEN p1.amount > 0 THEN properties(u1) ELSE properties(u) END AS to
      LIMIT 1
      `,
      { paymentid }
    );

    return res.records.length !== 0
      ? {
          ...res.records[0].get("payment"),
          from: res.records[0].get("from"),
          to: res.records[0].get("to"),
          comments: await Comment.findByTargetId(Nodes.Payment, paymentid),
        }
      : undefined;
  }
}

export { Payment, IPayment };
