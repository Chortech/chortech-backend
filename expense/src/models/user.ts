import { UserCreatedListener } from "../listeners/user-created-listener";
import { graph, Nodes, Relations } from "../utils/neo";

interface IUser {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  picture?: string;
}

class User {
  static async create(user: IUser) {
    await graph.run("CREATE (u:User {id: $id}) SET u += $user ", {
      id: user.id,
      user,
    });
  }

  static async exists(ids: string[]) {
    return await graph.exists(Nodes.User, ids);
  }

  static async update(user: IUser) {
    await graph.run(
      `
		MATCH (u:${Nodes.User} {id: $id}) 
		SET u += $user`,
      {
        id: user.id,
        user,
      }
    );
  }

  static async delete(id: string) {
    await graph.run(
      `
			MATCH (u:${Nodes.User} {id: $id})
			DETACH DELETE u;
		`,
      { id }
    );
  }

  static async assginCreator(target: Nodes, targetid: string, creator: string) {
    // assign the created relation
    await graph.run(
      `MATCH (u:${Nodes.User} {id: $creator}), (t: ${target} {id: $targetid})
       CREATE (u)-[:${Relations.Created}]->(t)`,
      { creator, targetid }
    );
  }
}

export { User, IUser };
