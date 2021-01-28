import { graph, Nodes, Relations } from "./neo";

class Query {
  /**
   *
   * @param id user id
   * @description returns details about who this user ows money
   * // this corresponds to api/balances/friends
   * or need to get money from
   */
  async findAllFriendsBalances(userid: string) {
    const res = await graph.run(
      `MATCH (u:${Nodes.User} {id: $userid})
        -[r:${Relations.Owe}|${Relations.Paid}]-(u1:${Nodes.User})
        RETURN properties(u) as user, properties(u1) as other, 
				sum(
          	CASE type(r)  
          	WHEN "OWE" THEN (CASE WHEN startNode(r) = u THEN -r.amount ELSE r.amount END)
          	ELSE (CASE WHEN startNode(r) = u THEN r.amount ELSE -r.amount END)
          	END
          ) as balance;
      `,
      {
        userid,
      }
    );
    const relations: any[] = [];

    for (const rec of res.records) {
      relations.push({
        self: rec.get("user"),
        other: rec.get("other"),
        balance: rec.get("balance"),
      });
    }
    return relations;
  }

  /**
   * @description returns all the expenses between a user and Associates.
   * this corresponds to /api/balances/friends/:id.
   * @param userid user id
   */

  async findFriendBalances(userid: string, associateid: string) {
    const res = await graph.run(
      `MATCH (u:${Nodes.User} {id: $userid})-[:${Relations.Participate}]->
      (n)<-[:${Relations.Participate}]-(u1:${Nodes.User} {id: $associateid})
      WITH n,u,u1
			ORDER BY n.created_at DESC
      CALL{
        WITH n,u,u1
        MATCH (u)-[r:${Relations.Owe}|${Relations.Paid} {id: n.id}]-(u1)
        RETURN apoc.map.merge(
          properties(n),
          {
            type: toLower(labels(n)[0]),
            balance:sum(CASE WHEN startNode(r) = u THEN -r.amount ELSE r.amount END)
          }
        ) as expense
      }
      RETURN u1.id as other, collect(expense) as expenses
    `,
      { userid, associateid }
    );

    if (res.records.length === 0) return null;
    return {
      other: res.records[0].get("other"),
      expenses: res.records[0].get("expenses"),
    };
  }

  /**
   * @description find all balances of group with id groupid
   * this is used in get group balances route
   * @param userid user id
   */

  async findGroupBalances(groupid: string) {
    const res = await graph.run(
      `MATCH (u:User)-[:MEMBER]->(g:Group {id: $groupid})
      CALL {
        WITH u,g
        MATCH (u)-[:MEMBER]->(g)<-[:MEMBER]-(u2:User)
          WHERE u <> u2 AND (u)-[:OWE|PAID]-(u2)
          CALL{
            WITH u,g,u2
              MATCH (u)-[r:PARTICIPATE]->(e)-[:ASSIGNED]->(g)<-[:MEMBER]-(u2)
              WHERE (e)<-[:PARTICIPATE]-(u2)
              RETURN sum(CASE labels(e)[0] WHEN "Payment" then -r.amount else r.amount end) as balance
          }
          RETURN collect(apoc.map.merge(properties(u2), {balance: balance})) as balances
      }
      RETURN collect({id: u.id, balances: balances}) as balances
      `,
      { groupid }
    );

    return res.records.length !== 0 ? res.records[0].get("balances") : null;
  }

  /**
   * @description find balance of user with id userid in all groups
   * this corresponds to api/balances/groups
   * @param userid user id
   */
  async findAllGroupsBalances(userid: string) {
    const res = await graph.run(
      `MATCH (u:${Nodes.User} {id: $userid})-[:${Relations.Member}]->(g:${Nodes.Group})
      CALL {
        WITH g,u
        MATCH (g)<-[:${Relations.Assigned}]-(e)<-[r:${Relations.Participate}]-(u)
        RETURN sum(CASE labels(e)[0] WHEN "Payment" then -r.amount else r.amount end) as balance
      }
      RETURN collect(apoc.map.merge(properties(g), {balance: balance})) as balances
      `,
      { userid }
    );

    return res.records.length !== 0 ? res.records[0].get("balances") : null;
  }

  /**
   * @description find balance of user with id userid in all groups
   * this corresponds to api/expenses/groups/:id
   * @param userid user id
   */
  async findGroupExpenses(userid: string, groupid: string) {
    const res = await graph.run(
      `MATCH (g:${Nodes.Group} {id: $groupid})<-[:${Relations.Assigned}]-(e)
      CALL{
        WITH e
        MATCH (:${Nodes.User} {id: $userid})-[r:${Relations.Participate}]->(e)
        RETURN CASE WHEN count(r) = 0 THEN 0 ELSE r.amount END as balance 

      }
      RETURN properties(g) as  group, 
      collect(
        apoc.map.merge(
          properties(e),
          { 
              type: toLower(labels(e)[0]),
              balance: balance
          }
        )
      )as expenses;
      `,
      { userid, groupid }
    );

    return res.records.length !== 0
      ? {
          group: res.records[0].get("group"),
          expenses: res.records[0].get("expenses"),
        }
      : null;
  }
}

export const query = new Query();
