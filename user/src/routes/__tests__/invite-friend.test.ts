import request from "supertest";
import { app } from "../../app";
import { users } from "../../test/setup";

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
