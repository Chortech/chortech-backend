import request from "supertest";
import User from "../../models/user";
import { app } from "../../app";
import { users } from "../../test/setup";

it("should get user's profile", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .get("/api/user/profile")
    .set("Authorization", `Bearer ${token}`)
    .send()
    .expect(200);
});

it("should not get user's profile without auth token", async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );

    await request(app).get("/api/user/profile").send().expect(401);
});

it("should not get user's profile with an invalid auth token", async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );

    await request(app)
        .get("/api/user/profile")
        .set('Authorization', 'hfdalkfwaljekf')
        .send().expect(401);
});
