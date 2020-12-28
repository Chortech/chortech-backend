import request from "supertest";
import { users } from "../../test/setup";
import { app } from "../../app";
import { graph } from "../../utils/neo";
const base = "/api/expenses";

const expense = () => {
  return {
    description: "this is an expense",
    total: 20,
    paid_at: 1608673567,
    participants: [
      {
        id: users[0].id,
        role: "creditor",
        amount: 20,
      },
      {
        id: users[1].id,
        role: "debtor",
        amount: 10,
      },
      {
        id: users[2].id,
        role: "debtor",
        amount: 10,
      },
    ],
  };
};

it("shoud remove an exepense", async () => {
  const { id, token } = await global.signin(users[0].id);
  let res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense())
    .expect(201);

  expect(res.body.id).toBeDefined();
  const eid = res.body.id;
  res = await request(app)
    .delete(`${base}/${eid}`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense())
    .expect(200);
  res = await request(app)
    .get(`${base}/${eid}`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense())
    .expect(404);
  res = await request(app)
    .get(`${base}/friends`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  expect(res.body.length).toBe(0);
});
