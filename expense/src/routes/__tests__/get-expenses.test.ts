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

const expense2 = () => {
  return {
    description: "this is an expense",
    total: 25,
    paid_at: 1608673567,
    participants: [
      {
        id: users[0].id,
        role: "debtor",
        amount: 25,
      },
      {
        id: users[1].id,
        role: "creditor",
        amount: 15,
      },
      {
        id: users[2].id,
        role: "creditor",
        amount: 10,
      },
    ],
  };
};

it("should get an expense", async () => {
  const { id, token } = await global.signin(users[0].id);
  let res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense())
    .expect(201);
  expect(res.body.id).toBeDefined();

  res = await request(app)
    .get(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  expect(res.body.length).toBe(1);
});

it("should get multiple expenses", async () => {
  const { id, token } = await global.signin(users[0].id);
  const eids: number[] = [];
  let res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense())
    .expect(201);

  expect(res.body.id).toBeDefined();
  eids.push(res.body.id);
  res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense())
    .expect(201);

  expect(res.body.id).toBeDefined();
  eids.push(res.body.id);
  res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense2())
    .expect(201);

  expect(res.body.id).toBeDefined();
  eids.push(res.body.id);
  res = await request(app)
    .get(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  expect(res.body.length).toBe(3);
  let count = 0;

  for (const id of eids) {
    for (let i = 0; i < eids.length; i++) {
      if (eids[i] === id) {
        count++;
        break;
      }
    }
  }

  expect(count).toBe(3);
});
