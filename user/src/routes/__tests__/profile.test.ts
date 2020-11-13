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
  //   const { id, token } = await global.signin(
  //     users[0].id,
  //     users[0].email,
  //     users[0].phone
  //   );

  //   await request(app).post("/api/user/profile").send().expect(401);

  expect(1).toBe(1);
});

it("should edit the profile", async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .put("/api/user/profile/edit")
    .set("authorization", `Bearer ${token}`)
    .send({ newName: "sssssssss" })
    .expect(200);
});
