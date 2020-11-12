import request from "supertest";
import User from "../../models/user";
import { app } from "../../app";
import { users } from "../../test/setup";

it("should add a friend", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  const res = await request(app)
    .put(`/api/user/friends/${users[1].id}`)
    .set("authorization", `Bearer ${token}`)
    .send();
  expect(res.status).toBe(200);
  const user = await User.findById(id);
  expect(user?.friends.length).toBe(1);
});

it("should add 3 friends", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  await request(app)
    .put(`/api/user/friends/${users[1].id}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(200);
  await request(app)
    .put(`/api/user/friends/${users[2].id}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(200);
  await request(app)
    .put(`/api/user/friends/${users[3].id}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(200);

  const user = await User.findById(id);
  expect(user?.friends.length).toBe(3);
});

it("should NOT accept equal userid and friendid ", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  await request(app)
    .put(`/api/user/friends/${id}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(400);

  const user = await User.findById(id);
  expect(user?.friends.length).toBe(0);
});

it("should NOT add a friend twice", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  await request(app)
    .put(`/api/user/friends/${users[1].id}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(200);
  await request(app)
    .put(`/api/user/friends/${users[1].id}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(409);

  const user = await User.findById(id);
  expect(user?.friends.length).toBe(1);
});

it("should NOT accept invalid id", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  await request(app)
    .put(`/api/user/friends/sjgagajgsjagsjagsjagjsa`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(400);

  const user = await User.findById(id);
  expect(user?.friends.length).toBe(0);
});

it("should NOT add friend without a valid token", async () => {
  await request(app)
    .put(`/api/user/friends/${users[1].id}`)
    .set("authorization", `Bearer hajkhsakjhskahska`)
    .send()
    .expect(401);
});
