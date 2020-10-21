import request from "supertest";
import { app } from "../../app";

it("should signup a user with email and password", async () => {
  await request(app)
    .post("/api/auth/signup")
    .send({
      email: "example@domain.com",
      name: "example123",
      password: "123456789",
    })
    .expect(201);
});

it("should not signup a user with email and password twice", async () => {
  await request(app)
    .post("/api/auth/signup")
    .send({
      email: "example@domain.com",
      name: "example123",
      password: "123456789",
    })
    .expect(201);

  await request(app)
    .post("/api/auth/signup")
    .send({
      email: "example@domain.com",
      name: "example123",
      password: "123456789",
    })
    .expect(400);
});

it("should signup a user with phone and password", async () => {
  fail();
});

it("should not signup a user with phone and password twice", async () => {
  fail();
});

it("should not signup a user with invalid email", async () => {
  fail();
});

it("should not signup a user with invalid phone", async () => {
  fail();
});

it("should not signup a user with incorrect name and password", async () => {
  fail();
});

it("should signup a user with email and phone together", async () => {
  fail();
});
