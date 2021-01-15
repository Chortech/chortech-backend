import { v4 as uuid } from "uuid";
import { graph, Nodes, Relations } from "../utils/neo";
import { IUser } from "./user";

interface IComment {
  id: string;
  writer: IUser;
  text: string;
  created_at: number;
}

class Comment {
  // TODO handle the case that user does not belong in this expense

  async get(expenseid: string): Promise<IComment[]> {
    const res = await graph.run(
      `
    MATCH (e:${Nodes.Expense} {id: $eid})<-[c:${Relations.Wrote}]-(u:${Nodes.User})
		RETURN {
			id: c.id
			writer: u
			text: c.text
			created_at: c.created_at 
		} as comment`,
      { expenseid }
    );
    const comments: IComment[] = [];
    for (const rec of res.records) {
      comments.push(rec.get("comment"));
    }

    return comments;
  }

  async create(
    expenseid: string,
    writerid: string,
    comment: { text: string; created_at: number }
  ) {
    await graph.run(
      `
		`,
      {}
    );
  }
}
