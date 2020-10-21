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
