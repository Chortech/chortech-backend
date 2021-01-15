import { UserCreatedListener } from "../listeners/user-created-listener";
import { graph, Nodes } from "../utils/neo";

interface IUser {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  picture?: string;
}

class User {
  static async create(user: IUser) {
    await graph.run("CREATE (:User {id: $id , name: $name })", {
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }

  static async exists(id: string) {
    const res = await graph.run(
      `
      MATCH (u:${Nodes.User} {id: $id}) 
    	RETURN count(u) as count;`,
      { id }
    );

    return res.records[0].get("count") === 1;
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
}

export { User, IUser };
