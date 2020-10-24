import request from "supertest";
import { app } from "../../app";
import { Password } from "../../utils/password";
import { Token } from "../../utils/jwt";
import User from "../../models/user";
import { verify } from "@chortec/common";

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
    .expect(409);
});

it("should signup a user with phone and password", async () => {
  await request(app)
    .post("/api/auth/signup")
    .send({
      phone: "09333333333",
      name: "example123",
      password: "123456789",
    })
    .expect(201);
});

it("should not signup a user with phone and password twice", async () => {
  await request(app)
    .post("/api/auth/signup")
    .send({
      phone: "09333333333",
      name: "example123",
      password: "123456789",
    })
    .expect(201);
  await request(app)
    .post("/api/auth/signup")
    .send({
      phone: "09333333333",
      name: "example123",
      password: "123456789",
    })
    .expect(409);
});

it("should not signup a user with invalid email", async () => {
  await request(app)
    .post("/api/auth/signup")
    .send({
      email: "exampledomain.com",
      name: "example123",
      password: "123456789",
    })
    .expect(400);
});

it("should not signup a user with invalid phone", async () => {
  await request(app)
    .post("/api/auth/signup")
    .send({
      phone: "009333333333",
      name: "example123",
      password: "123456789",
    })
    .expect(400);
  await request(app)
    .post("/api/auth/signup")
    .send({
      phone: "+9333333333",
      name: "example123",
      password: "123456789",
    })
    .expect(400);

  await request(app)
    .post("/api/auth/signup")
    .send({
      phone: "sgaksakjsa",
      name: "example123",
      password: "123456789",
    })
    .expect(400);
  await request(app)
    .post("/api/auth/signup")
    .send({
      phone: "123456789123",
      name: "example123",
      password: "123456789",
    })
    .expect(400);
});

it("should not signup a user with incorrect name and password", async () => {
  await request(app)
    .post("/api/auth/signup")
    .send({
      phone: "123456789123",
      name: "ex",
      password: "123456789",
    })
    .expect(400);

  await request(app)
    .post("/api/auth/signup")
    .send({
      phone: "123456789123",
      name: "ex@#%^&&^*SAJBK",
      password: "123456789",
    })
    .expect(400);
  await request(app)
    .post("/api/auth/signup")
    .send({
      phone: "123456789123",
      name: "example",
      password: "123",
    })
    .expect(400);
});

it("should signup a user with email and phone together", async () => {
  await request(app)
    .post("/api/auth/signup")
    .send({
      email: "example@domain.com",
      phone: "09333333333",
      name: "example123",
      password: "123456789",
    })
    .expect(201);
});

it("should not signup a user with by chaning email or phone and keeping the other one the same", async () => {
  await request(app).post("/api/auth/signup").send({
    email: "first@domain.com",
    phone: "09333333333",
    name: "example123",
    password: "123456789",
  });

  await request(app)
    .post("/api/auth/signup")
    .send({
      email: "second@domain.com",
      phone: "09333333333",
      name: "example123",
      password: "123456789",
    })
    .expect(409);

  await request(app)
    .post("/api/auth/signup")
    .send({
      email: "first@domain.com",
      phone: "09444444444",
      name: "example123",
      password: "123456789",
    })
    .expect(409);
});

it("should not save user's password as plain text", async () => {
  const password = "1234mypass4567";

  const req = await request(app)
    .post("/api/auth/signup")
    .send({
      email: "example@domain.com",
      phone: "09333333333",
      name: "example123",
      password: password,
    })
    .expect(201);
  const { id } = req.body;
  const user = await User.findOne({ _id: id });
  expect(user).toBeDefined();
  expect(await Password.compare(password, user?.password!)).toBe(true);
});

it("should respond with avalid access token", async () => {
  const req = await request(app)
    .post("/api/auth/signup")
    .send({
      email: "example@domain.com",
      phone: "09333333333",
      name: "example123",
      password: "1234mypass4567",
    })
    .expect(201);

  const { id, token } = req.body;
  const { access, expires, created } = token as Token;
  const decoded = await verify(access);
  expect(decoded.user.id).toBe(id);
  expect(decoded.exp).toBe(expires);
  expect(decoded.iat).toBe(created);
});
