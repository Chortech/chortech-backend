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

it("should add an expense", async () => {
  const { id, token } = await global.signin(users[0].id);

  const res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense())
    .expect(201);
  const expenses = await graph.getExpenses(id);
  expect(expenses).toBeDefined();
  expect(expenses!.length).toBe(1);
  expect(expenses![0].you.role).toBe("creditor");
  expect(expenses![0].you.amount).toBe(20);
});

it("should add multiple expense expense", async () => {
  const { id, token } = await global.signin(users[0].id);

  let res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense())
    .expect(201);
  res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense())
    .expect(201);
  res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense2())
    .expect(201);

  const expenses = await graph.getExpenses(id);
  expect(expenses).toBeDefined();
  expect(expenses!.length).toBe(3);
});
