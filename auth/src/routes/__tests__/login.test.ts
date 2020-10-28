import request from "supertest";
import { app } from "../../app";

const signupEmail = async () => {
  await global.mockVerification("example@domain.com");
  await request(app).post("/api/auth/signup").send({
    email: "example@domain.com",
    name: "nameee",
    password: "password",
  });
};

const signupPhone = async () => {
  await global.mockVerification("09333333333");
  await request(app)
    .post("/api/auth/signup")
    .send({ phone: "09333333333", name: "nameee", password: "password" })
    .expect(201);
};

it("shoud not accept both email and phone", async () => {
  await request(app)
    .post("/api/auth/login")
    .send({
      email: "example@domain.com",
      phone: "09333333333",
      password: "password",
    })
    .expect(400);
});

it("shoud not accept invalid password", async () => {
  await request(app)
    .post("/api/auth/login")
    .send({
      email: "example@domain.com",
      phone: "09333333333",
      password: "123",
    })
    .expect(400);
});

it("shoud not authenticate a user that doesnt exists", async () => {
  await request(app)
    .post("/api/auth/login")
    .send({ email: "example@domain.com", password: "password" })
    .expect(401);

  await request(app)
    .post("/api/auth/login")
    .send({ phone: "09333333333", password: "password" })
    .expect(401);
});

it("shoud not authenticate a user with wrong password", async () => {
  await signupEmail();
  await signupPhone();
  await request(app)
    .post("/api/auth/login")
    .send({ email: "example@domain.com", password: "wordpass" })
    .expect(401);

  await request(app)
    .post("/api/auth/login")
    .send({ phone: "09333333333", password: "wordpass" })
    .expect(401);
});

it("shoud not authenticate a user with wrong email or phone", async () => {
  await signupEmail();
  await signupPhone();
  await request(app)
    .post("/api/auth/login")
    .send({ email: "wrong@domain.com", password: "password" })
    .expect(401);

  await request(app)
    .post("/api/auth/login")
    .send({ phone: "09123456789", password: "password" })
    .expect(401);
});

it("shoud authenticate a user with correct credentials and send a token back", async () => {
  await signupEmail();
  await signupPhone();

  const req = await request(app)
    .post("/api/auth/login")
    .send({ email: "example@domain.com", password: "password" })
    .expect(200);

  const req2 = await request(app)
    .post("/api/auth/login")
    .send({ phone: "09333333333", password: "password" })
    .expect(200);
  expect(req.body.token).toBeDefined();
  expect(req2.body.token).toBeDefined();
});
