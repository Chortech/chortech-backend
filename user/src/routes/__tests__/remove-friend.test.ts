import request from "supertest";
import { app } from "../../app";
import User from "../../models/user";
import { users } from "../../test/setup";

const addFriend = async (
  user: {
    id: string;
    email?: string;
    phone?: string;
  },
  fId: string
) => {
  const { id, token } = await global.signin(user.id, user.email, user.phone);
  const res = await request(app)
    .put(`/api/user/friends/${fId}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(200);
};

it("should remove a friend", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  await addFriend(users[0], users[1].id);

  expect((await User.findById(id))?.friends.length).toBe(1);
  await request(app)
    .delete(`/api/user/friends/${users[1].id}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(200);
  const user = await User.findById(id);
  expect(user?.friends.length).toBe(0);
});

it("should remove 3 friends", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  await addFriend(users[0], users[1].id);
  await addFriend(users[0], users[2].id);
  await addFriend(users[0], users[3].id);

  expect((await User.findById(id))?.friends.length).toBe(3);
  await request(app)
    .delete(`/api/user/friends/${users[1].id}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(200);
  await request(app)
    .delete(`/api/user/friends/${users[2].id}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(200);
  await request(app)
    .delete(`/api/user/friends/${users[3].id}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(200);
  const user = await User.findById(id);
  expect(user?.friends.length).toBe(0);
});

it("should NOT remove a friend twice", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  await addFriend(users[0], users[1].id);

  expect((await User.findById(id))?.friends.length).toBe(1);
  await request(app)
    .delete(`/api/user/friends/${users[1].id}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(200);

  await request(app)
    .delete(`/api/user/friends/${users[1].id}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(404);
  const user = await User.findById(id);
  expect(user?.friends.length).toBe(0);
});

it("should NOT accept invalid id", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  await addFriend(users[0], users[1].id);

  expect((await User.findById(id))?.friends.length).toBe(1);
  await request(app)
    .delete(`/api/user/friends/kshajhskajhskjah`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(400);
  expect((await User.findById(id))?.friends.length).toBe(1);
});

it("should NOT remove a friend with invalid token", async () => {
  await addFriend(users[0], users[1].id);

  expect((await User.findById(users[0].id))?.friends.length).toBe(1);
  await request(app)
    .delete(`/api/user/friends/${users[1].id}`)
    .set("authorization", `Bearer sjakhgjagsas`)
    .send()
    .expect(401);
  expect((await User.findById(users[0].id))?.friends.length).toBe(1);
});

it("should NOT remove a friend that doesn't exists", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  await addFriend(users[0], users[1].id);

  expect((await User.findById(id))?.friends.length).toBe(1);
  await request(app)
    .delete(`/api/user/friends/${users[2].id}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(404);

  expect((await User.findById(id))?.friends.length).toBe(1);
});

it("should NOT accept equal values for friend and userid", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
  await addFriend(users[0], users[1].id);

  expect((await User.findById(id))?.friends.length).toBe(1);
  await request(app)
    .delete(`/api/user/friends/${id}`)
    .set("authorization", `Bearer ${token}`)
    .send()
    .expect(400);

  expect((await User.findById(id))?.friends.length).toBe(1);
});
