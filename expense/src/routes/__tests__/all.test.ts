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
const expense4 = () => {
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

it("should add a comment", async () => {
  const { id, token } = await global.signin(users[0].id);
  let res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense())
    .expect(201);

  expect(res.body.id).toBeDefined();

  const eid = res.body.id;

  res = await request(app)
    .post(`${base}/${eid}/comments`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      text: "this is a comment",
      created_at: Date.now(),
    })
    .expect(201);
  const comments = await graph.getComments(eid);
  expect(comments).toBeDefined();
  expect(comments!.length).toBe(1);
  expect(comments![0].text).toBe("this is a comment");
  expect(comments![0].writer.id).toBe(id);
});
it("should add multiple comments", async () => {
  const { id, token } = await global.signin(users[0].id);
  const u2 = await global.signin(users[1].id);
  const u3 = await global.signin(users[2].id);
  let res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense())
    .expect(201);

  expect(res.body.id).toBeDefined();

  const eid = res.body.id;

  res = await request(app)
    .post(`${base}/${eid}/comments`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      text: "this is a comment",
      created_at: Date.now(),
    })
    .expect(201);
  res = await request(app)
    .post(`${base}/${eid}/comments`)
    .set("Authorization", `Bearer ${u3.token}`)
    .send({
      text: "this is a comment",
      created_at: Date.now(),
    })
    .expect(201);
  res = await request(app)
    .post(`${base}/${eid}/comments`)
    .set("Authorization", `Bearer ${u2.token}`)
    .send({
      text: "this is a comment",
      created_at: Date.now(),
    })
    .expect(201);
  const comments = await graph.getComments(eid);
  expect(comments).toBeDefined();
  expect(comments!.length).toBe(3);
});

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

it("should get comments for an expense", async () => {
  const { id, token } = await global.signin(users[0].id);
  let res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense())
    .expect(201);

  expect(res.body.id).toBeDefined();

  const eid = res.body.id;

  res = await request(app)
    .post(`${base}/${eid}/comments`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      text: "this is a comment",
      created_at: Date.now(),
    })
    .expect(201);
  res = await request(app)
    .get(`${base}/${eid}/comments`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      text: "this is a comment",
      created_at: Date.now(),
    })
    .expect(200);

  expect(res.body).toBeDefined();
  expect(res.body.length).toBe(1);
  expect(res.body[0].text).toBe("this is a comment");
  expect(res.body[0].writer.id).toBe(id);
});
it("should get multiple comments for an expense", async () => {
  const { id, token } = await global.signin(users[0].id);
  const u2 = await global.signin(users[1].id);
  const u3 = await global.signin(users[2].id);
  let res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense())
    .expect(201);

  expect(res.body.id).toBeDefined();

  const eid = res.body.id;

  res = await request(app)
    .post(`${base}/${eid}/comments`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      text: "this is a comment",
      created_at: Date.now(),
    })
    .expect(201);
  res = await request(app)
    .post(`${base}/${eid}/comments`)
    .set("Authorization", `Bearer ${u3.token}`)
    .send({
      text: "this is a comment",
      created_at: Date.now(),
    })
    .expect(201);
  res = await request(app)
    .post(`${base}/${eid}/comments`)
    .set("Authorization", `Bearer ${u2.token}`)
    .send({
      text: "this is a comment",
      created_at: Date.now(),
    })
    .expect(201);

  res = await request(app)
    .get(`${base}/${eid}/comments`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      text: "this is a comment",
      created_at: Date.now(),
    })
    .expect(200);
  expect(res.body).toBeDefined();
  expect(res.body.length).toBe(3);
});

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
    .send(expense4())
    .expect(201);
  res = await request(app)
    .post(`${base}/`)
    .set("Authorization", `Bearer ${token}`)
    .send(expense4())
    .expect(201);
  res = await request(app)
    .get(`${base}/friends`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  console.log(res.body);
  expect(res.body.length).toBe(0);
});

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
