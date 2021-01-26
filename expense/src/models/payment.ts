import { graph, Nodes } from "../utils/neo";
import { IComment } from "./comment";
import { v4 as uuid } from "uuid";
import { Group } from "./group";

interface IPayment {
  id: string;
  from: string;
  to: string;
  amount: number;
  paid_at: number;
  group?: string;
  notes?: string;
  comments?: IComment[];
}

class Payment {
  static async create(payment: IPayment) {
    payment.id = payment.id ? payment.id : uuid();
    const session = graph.runMultiple();

    // create payment node and participate relations
    await session.run(
      `CREATE (p:Payment {id: $paymentid}) SET p= $payment
			CALL {
				WITH p
				MATCH (from:User {id: p.from}), (to:User {id: p.to})
				MERGE (from)-[:PARTICIPATE {amount: p.amount}]->(p)<-[:PARTICIPATE {amount: -p.amount}]-(to)
				RETURN r
			}
			RETURN r
			`,
      {
        payment: {
          id: payment.id,
          from: payment.from,
          to: payment.to,
          amount: payment.amount,
          paid_at: payment.paid_at,
          notes: payment.notes,
        },
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
    await graph.deleteNodeWithRelations(Nodes.Payment, paymentid);
  }
  static async update(payment: IPayment) {
    // you cant change the users keep that in mind :)
    throw new Error("Not Implemented!");
  }
}
