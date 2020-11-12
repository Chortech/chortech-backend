import request from "supertest";
import { app } from "../../app";
import { users } from "../../test/setup";

it("should work for now", async () => {
  const user = users[0];
  const { id, token } = await global.signin(user.id, user.email, user.phone);
  const res = await request(app)
    .get("/api/user/friends/invite")
    .set("authorization", `Bearer ${token}`)
    .send();

  console.log(res.body);
});
