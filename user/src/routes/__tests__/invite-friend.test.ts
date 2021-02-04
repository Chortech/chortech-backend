import request from "supertest";
import { app } from "../../app";
import { users } from "../../test/setup";
import { natsWrapper } from "../../utils/nats-wrapper";

it("should invite one or multiple users", async () => {
  const user = users[0];
  const { id, token } = await global.signin(user.id, user.email, user.phone);

  await request(app)
    .post("/api/user/friends/invite")
    .set("authorization", `Bearer ${token}`)
    .send({
      invitees: [
        {
          email: "example3@domain.com",
          name: "nameee",
        },
      ],
    })
    .expect(200);
  await request(app)
    .post("/api/user/friends/invite")
    .set("authorization", `Bearer ${token}`)
    .send({
      invitees: [
        {
          email: "example3@domain.com",
          name: "nameee",
        },
        {
          phone: "09333333333",
          name: "eeeman",
        },
        {
          phone: "09333353333",
          name: "eeeman",
        },
      ],
    })
    .expect(200);
});

it("should ONLY accept an array of invitees", async () => {
  const user = users[0];
  const { id, token } = await global.signin(user.id, user.email, user.phone);

  await request(app)
    .post("/api/user/friends/invite")
    .set("authorization", `Bearer ${token}`)
    .send({
      invitees: {
        email: "example3@domain.com",
        name: "nameee",
      },
    })
    .expect(400);

  await request(app)
    .post("/api/user/friends/invite")
    .set("authorization", `Bearer ${token}`)
    .send({
      email: "example3@domain.com",
      name: "nameee",
    })
    .expect(400);
});

it("should NOT accept duplicate values for phone or email", async () => {
  const user = users[0];
  const { id, token } = await global.signin(user.id, user.email, user.phone);

  await request(app)
    .post("/api/user/friends/invite")
    .set("authorization", `Bearer ${token}`)
    .send({
      invitees: [
        {
          email: "example3@domain.com",
          name: "nameee",
        },
        {
          phone: "09333333333",
          name: "eeeman",
        },
        {
          phone: "09333333333",
          name: "eeeman",
        },
      ],
    })
    .expect(400);

  await request(app)
    .post("/api/user/friends/invite")
    .set("authorization", `Bearer ${token}`)
    .send({
      invitees: [
        {
          email: "example3@domain.com",
          name: "nameee",
        },
        {
          email: "example3@domain.com",
          name: "eeeman",
        },
        {
          phone: "09333353333",
          name: "eeeman",
        },
      ],
    })
    .expect(400);
});

it("should NOT invite someone if he/she is already a user", async () => {
  const user = users[0];
  const { id, token } = await global.signin(user.id, user.email, user.phone);

  await request(app)
    .post("/api/user/friends/invite")
    .set("authorization", `Bearer ${token}`)
    .send({
      invitees: [
        {
          email: users[1].email,
          name: users[1].name,
        },
      ],
    })
    .expect(409);

  await request(app)
    .post("/api/user/friends/invite")
    .set("authorization", `Bearer ${token}`)
    .send({
      invitees: [
        {
          email: users[1].email,
          name: users[1].name,
        },
        {
          phone: users[2].phone,
          name: users[2].name,
        },
        {
          phone: users[3].phone,
          name: users[3].name,
        },
      ],
    })
    .expect(409);
});

it("should publish an invite message", async () => {
  const user = users[0];
  const { id, token } = await global.signin(user.id, user.email, user.phone);

  await request(app)
    .post("/api/user/friends/invite")
    .set("authorization", `Bearer ${token}`)
    .send({
      invitees: [
        {
          email: "my@domain.com",
          name: "nameee",
        },
      ],
    })
    .expect(200);

  expect(natsWrapper.client.publish).toBeCalledTimes(1);
});

it("should NOT invite friends with invalid token", async () => {
  await request(app)
    .post("/api/user/friends/invite")
    .set("authorization", `Bearer skjagjsgahsgja`)
    .send({
      invitees: [
        {
          email: "my@domain.com",
          name: "nameee",
        },
      ],
    })
    .expect(401);

  await request(app)
    .post("/api/user/friends/invite")
    .send({
      invitees: [
        {
          email: "my@domain.com",
          name: "nameee",
        },
      ],
    })
    .expect(401);
});
