import request from "supertest";
import User from "../../models/user";
import { app } from "../../app";
import { users } from "../../test/setup";
import mongoose from "mongoose";

it("should add a friend with email", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  const res = await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({
      email: users[1].email,
    });
  expect(res.status).toBe(200);
  const user = await User.findById(id);
  expect(user?.friends.length).toBe(1);
});
it("should add a friend with phone", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  const res = await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({
      phone: users[2].phone,
    });
  expect(res.status).toBe(200);
  const user = await User.findById(id);
  expect(user?.friends.length).toBe(1);
});
it("should invalidate a body with both email and phone", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  const res = await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({
      phone: users[2].phone,
      email: users[1].email,
    });
  expect(res.status).toBe(400);
  const user = await User.findById(id);
  expect(user?.friends.length).toBe(0);
});
it("should NOT accept users own email", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  const res = await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({
      email: users[0].email,
    });
  expect(res.status).toBe(400);
  const user = await User.findById(id);
  expect(user?.friends.length).toBe(0);
});
it("should NOT accept users own phone", async () => {
  const { id, token } = await global.signin(
    users[2].id,
    users[2].email,
    users[2].phone
  );
  const res = await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({
      phone: users[2].phone,
    });
  expect(res.status).toBe(400);
  const user = await User.findById(id);
  expect(user?.friends.length).toBe(0);
});
it("should add friend and make the caller their friend as well", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  const res = await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({
      phone: users[2].phone,
    });
  expect(res.status).toBe(200);
  const user = await User.findById(id);
  const friend = await User.findById(users[2].id);
  expect(user?.friends.length).toBe(1);
  expect(friend?.friends.length).toBe(1);
  expect(user?.id).toBe(friend?.friends[0].toHexString());
  expect(friend?.id).toBe(user?.friends[0].toHexString());
});
it("should NOT add us as a friend when we add them first", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  const data = await global.signin(users[2].id, users[2].email, users[2].phone);

  await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({
      phone: users[2].phone,
    })
    .expect(200);

  const res = await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${data.token}`)
    .send({
      email: users[0].email,
    })
    .expect(409);
  const user = await User.findById(id);
  const friend = await User.findById(data.id);
  expect(user?.friends.length).toBe(1);
  expect(friend?.friends.length).toBe(1);
});

it("should add 3 friends", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({ email: users[1].email })
    .expect(200);
  await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({ phone: users[2].phone })
    .expect(200);
  await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({ phone: users[3].phone })
    .expect(200);

  const user = await User.findById(id);
  expect(user?.friends.length).toBe(3);
});

it("should NOT add a friend twice", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({ email: users[1].email })
    .expect(200);
  await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({ email: users[1].email })
    .expect(409);

  const user = await User.findById(id);
  expect(user?.friends.length).toBe(1);
});

it("should NOT accept invalid email", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({ email: "sghasajhshakjshakj" })
    .expect(400);

  const user = await User.findById(id);
  expect(user?.friends.length).toBe(0);
});

it("should NOT accept invalid phone", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({ phone: "sghasajhshakjshakj" })
    .expect(400);

  const user = await User.findById(id);
  expect(user?.friends.length).toBe(0);
});

it("should NOT add friend without a valid token", async () => {
  await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer hajkhsakjhskahska`)
    .send()
    .expect(401);
});

it("should NOT add friend which does not exist - email", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  const res = await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({
      email: "wrongemail@domain.com",
    })
    .expect(404);
});

it("should NOT add friend which does not exist - phone", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  const res = await request(app)
    .put(`/api/user/friends`)
    .set("authorization", `Bearer ${token}`)
    .send({
      phone: "09321456987",
    })
    .expect(404);
});
