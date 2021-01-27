import { v4 as uuid } from "uuid";
import { graph, Nodes, Relations } from "../utils/neo";
import { IUser } from "./user";

interface IComment {
  id: string; // comment id. we don't really need this.
  writer: IUser; // writer which is a user
  text: string; // comment text
  created_at: number; // the time when comment was created
}

type CommentableNodes = Nodes.Expense | Nodes.Payment;

class Comment {
  // TODO handle the case that user does not belong in this expense
  /**
   * @description get the all the comments written in expense with id expenseid
   * @param expenseid the id of the expense we're pulling comments out of DB
   *
   * @returns a list of IComment
   */
  static async findByTargetId(
    target: CommentableNodes,
    targetid: string
  ): Promise<IComment[]> {
    const res = await graph.run(
      `
    MATCH (e:${target} {id: $targetid})<-[c:${Relations.Wrote}]-(u:${Nodes.User})
		RETURN {
			id: c.id,
			writer: properties(u),
			text: c.text,
			created_at: c.created_at 
		} as comment`,
      { targetid }
    );
    const comments: IComment[] = [];
    for (const rec of res.records) {
      comments.push(rec.get("comment"));
    }

    return comments;
  }

  /**
   * @description it creates a comment by a userid to the
   * given expense
   * @param expenseid id of the expense we're creating a
   * comment for
   * @param writerid id of the user who wrote the comment
   * @param comment the actual comment with a text and ti-
   * mestamp for when the comment was created
   *
   * @returns the length of the created records. This should
   * be 1 if a comment was created and 0 otherwise
   */

  static async create(
    node: CommentableNodes,
    id: string,
    writerid: string,
    comment: { text: string; created_at: number }
  ) {
    const res = await graph.run(
      `
      MATCH (u:${Nodes.User} {id: $uid})-[:${Relations.Participate}]->(e:${node} {id: $id})
      CREATE (u)-[r:${Relations.Wrote}]->(e)
      SET r = $comment
      RETURN r;
			`,
      {
        uid: writerid,
        id: id,
        comment: {
          ...comment,
          id: uuid(),
        },
      }
    );

    return res.records.length;
  }

  static async createWithOutParticipation(
    node: CommentableNodes,
    id: string,
    writerid: string,
    comment: { text: string; created_at: number }
  ) {
    const res = await graph.run(
      `
      MATCH (u:${Nodes.User} {id: $uid}),(e:${node} {id: $id})
      CREATE (u)-[r:${Relations.Wrote}]->(e)
      SET r = $comment
      RETURN r;
			`,
      {
        uid: writerid,
        id: id,
        comment: {
          ...comment,
          id: uuid(),
        },
      }
    );

    return res.records.length;
  }
}

export { IComment, Comment, CommentableNodes };
