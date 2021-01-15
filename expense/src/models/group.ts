import { GroupUpdateType, IGroupUpdated } from "@chortec/common";
import { graph, Nodes, Relations } from "../utils/neo";

interface IGroup {
  id: string;
  owner?: string;
  name?: string;
  picture?: string;
  members?: string[];
}

class Group {
  static async create(group: IGroup) {
    await graph.run(
      `MATCH (u:User {id: $owner})
    CREATE (u)-[r:${Relations.Member} {owner: true}]->(g:Group {id:$gid, name:$name , picture: $picture})
    RETURN g`,
      {
        owner: group.owner,
        gid: group.id,
        name: group.name,
        picture: group.picture,
      }
    );
  }
  static async addMember(groupid: string, users: string[]) {
    const session = graph.driver.session();
    try {
      await session.run(
        `MATCH (g:${Nodes.Group} {id: $groupid})
        WITH g
        UNWIND $users as users
        MATCH (u:${Nodes.User} {id: users})
        CREATE (u)-[r:${Relations.Member}]->(g)
        RETURN r`,
        {
          groupid,
          users,
        }
      );
      await session.close();
    } catch (err) {
      await session.close();
      throw err;
    } finally {
      await session.close();
    }
  }
  static async removeMember(groupid: string, userid: string) {
    const session = graph.driver.session();
    try {
      // TODO Check if the user has an unsetteled expense or not

      // if not remove the member

      await session.run(
        `MATCH (u:${Nodes.User} {id: $userid})-[r:${Relations.Member}]->(g:${Nodes.Group} {id: $groupid})
          DELETE r`,
        {
          groupid,
          userid,
        }
      );
      await session.close();
    } catch (err) {
      await session.close();
      throw err;
    } finally {
      await session.close();
    }
  }
  static async delete(groupid: string) {
    const session = graph.driver.session();
    try {
      // TODO Check if the group has an unsetteled expense or not

      // if not remove the member

      await session.run(
        `MATCH (g:${Nodes.Group} {id: $id})
          DETACH DELETE  g`,
        {
          id: groupid,
        }
      );
      await session.close();
    } catch (err) {
      await session.close();
      throw err;
    } finally {
      await session.close();
    }
  }
  static async updateInfo(group: IGroup) {
    const session = graph.driver.session();
    try {
      await session.run(
        `MATCH (g:${Nodes.Group} {id: $id})
         SET g = $group`,
        {
          id: group.id,
          group,
        }
      );
      await session.close();
    } catch (err) {
      await session.close();
      throw err;
    } finally {
      await session.close();
    }
  }

  static async update(group: IGroupUpdated["data"]) {
    switch (group.type) {
      case GroupUpdateType.AddMember:
        if (!group.members)
          throw new Error("Members must not be empty for adding a member!");
        await Group.addMember(group.id, group.members);
        break;
      case GroupUpdateType.EditInfo:
        await Group.updateInfo({
          id: group.id,
          name: group.name,
          owner: group.creator,
          picture: group.picture,
        });
        break;
      case GroupUpdateType.LeaveGroup:
        if (!group.left)
          throw new Error(
            "Can't remove a member without specifying 'removed' !"
          );
        await Group.removeMember(group.id, group.left);
        break;
      case GroupUpdateType.RemoveMember:
        if (!group.removed)
          throw new Error(
            "Can't remove a member without specifying 'removed' !"
          );
        await Group.removeMember(group.id, group.removed);
        break;

      default:
        throw new Error("Wrong update type!");
    }
  }
}

export { Group, IGroup };
