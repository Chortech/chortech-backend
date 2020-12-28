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
