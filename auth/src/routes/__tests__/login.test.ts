import request from "supertest";
import { app } from "../../app";

it("shoud respond with status of 200", async () => {
  await request(app)
    .post("/api/auth/login")
    .send({ email: "example@domain.com", password: "password" })
    .expect(200);
});
