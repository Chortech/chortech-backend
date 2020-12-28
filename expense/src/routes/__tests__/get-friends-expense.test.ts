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
    total: 20,
    paid_at: 1608673567,
    participants: [
      {
        id: users[0].id,
        role: "debtor",
        amount: 20,
      },
      {
        id: users[1].id,
        role: "creditor",
        amount: 10,
      },
      {
        id: users[2].id,
        role: "creditor",
        amount: 10,
      },
    ],
  };
};

const expense3 = () => {
  return {
    description: "this is an expense",
    total: 115,
    paid_at: 1608673567,
    participants: [
      {
        id: users[0].id,
        role: "debtor",
        amount: 15,
      },
      {
        id: users[3].id,
        role: "debtor",
        amount: 60,
      },
      {
        id: users[4].id,
        role: "creditor",
        amount: 50,
      },
      {
        id: users[5].id,
        role: "creditor",
        amount: 65,
      },
      {
        id: users[6].id,
        role: "debtor",
        amount: 40,
      },
    ],
  };
};

it("shoud get all the pepole who has some relations with the user", async () => {
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
  res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense3())
    .expect(201);
  res = await request(app)
    .get(`${base}/friends`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  expect(res.body.length).toBe(3);
});
it("shoud have no relations with people if the debts are cleared", async () => {
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
  res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense2())
    .expect(201);
  res = await request(app)
    .get(`${base}/friends`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  expect(res.body.length).toBe(0);
});
