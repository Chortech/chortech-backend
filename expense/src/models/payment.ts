import { graph, Nodes, Relations } from "../utils/neo";
import { Comment, IComment } from "./comment";
import { v4 as uuid } from "uuid";
import { Group } from "./group";
import { IUser, User } from "./user";

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
      `CREATE (p:Payment {id: $paymentid, created_at: timestamp()}) SET p+= $payment
      WITH p
      MATCH (from:User {id: $from}), (to:User {id: $to})
      CREATE (from)-[r1:PARTICIPATE {amount: -p.amount}]->(p)<-[r2:PARTICIPATE {amount: p.amount}]-(to)
      SET p.from = from.name, p.to = to.name
      RETURN r1,r2
			`,
      {
        payment: {
          amount: payment.amount,
          paid_at: payment.paid_at,
          notes: payment.notes,
        },
        from: payment.from,
        to: payment.to,
        paymentid: payment.id,
      }
    );

    // create created relation
    await User.assginCreator(Nodes.Payment, payment.id, payment.creator);

    // create paid relations
    await session.run(
      `WITH $payment as p
			MATCH (from:User {id: p.from}), (to:User {id: p.to})
			CREATE (from)-[r:PAID {id: p.id, amount: p.amount}]->(to)
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
      `MATCH ()-[r:${Relations.Paid} {id: $paymentid}]->()
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
        `MATCH ()-[r:PAID {id: $paymentid}]->()
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
    creator: IUser;
    amount: number;
    paid_at: number;
    group?: string;
    notes?: string;
    comments?: IComment[];
  }> {
    const res = await graph.run(
      `MATCH (u:${Nodes.User})-[p1:${Relations.Participate}]->
      (p:Payment {id: $paymentid})
      <-[p2:${Relations.Participate}]-(u1:${Nodes.User}),
      (creator:${Nodes.User})-[:${Relations.Created}]->(p)
      RETURN properties(p) as payment,properties(creator) as creator, 
      CASE WHEN p1.amount > 0 THEN properties(u) ELSE properties(u1) END AS from,
      CASE WHEN p1.amount > 0 THEN properties(u1) ELSE properties(u) END AS to
      LIMIT 1
      `,
      { paymentid }
    );

    return res.records.length !== 0
      ? {
          ...res.records[0].get("payment"),
          creator: res.records[0].get("creator"),
          from: res.records[0].get("from"),
          to: res.records[0].get("to"),
          comments: await Comment.findByTargetId(Nodes.Payment, paymentid),
        }
      : undefined;
  }
}

export { Payment, IPayment };
