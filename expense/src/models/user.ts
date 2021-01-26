import { UserCreatedListener } from "../listeners/user-created-listener";
import { graph, Nodes } from "../utils/neo";

interface IUser {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  picture?: string;
}

class User {
  static async create(user: IUser) {
    await graph.run("CREATE (:User {id: $id , name: $name })", {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
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
}

export { User, IUser };
