import request from "supertest";
import { app } from "../../app";
import { setExpire, Token } from "../../utils/jwt";

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

const login = async (password: string, email?: string, phone?: string) => {
  const req = await request(app)
    .post("/api/auth/login")
    .send(phone ? { phone, password } : { email, password })
    .expect(200);
  const { id } = req.body;
  const token: Token = req.body.token;
  return {
    id,
    token: `Bearer ${token.access}`,
  };
};

beforeEach(async () => {
  await signupEmail();
  await signupPhone();
});

it("should not change password without an authentication token with email", async () => {
  await request(app)
    .put("/api/auth/changepass")
    .send({
      oldpass: "password",
      newpass: "123456789",
    })
    .expect(401);
});

it("should not change password with an invalid authentication token with email", async () => {
  await request(app)
    .put("/api/auth/changepass")
    .set("Authorization", "sshkjahska")
    .send({
      oldpass: "password",
      newpass: "123456789",
    })
    .expect(401);
});

it("should not change password with an expired authentication token with email", async () => {
  setExpire(1);
  const { id, token } = await login("password", "example@domain.com");
  await global.delay(1000);
  await request(app)
    .put("/api/auth/changepass")
    .set("Authorization", token)
    .send({
      oldpass: "password",
      newpass: "123456789",
    })
    .expect(403);
});

it("should not change password without an authentication token with phone", async () => {
  await request(app)
    .put("/api/auth/changepass")
    .send({
      oldpass: "password",
      newpass: "123456789",
    })
    .expect(401);
});

it("should not change password with an invalid authentication token with phone", async () => {
  await request(app)
    .put("/api/auth/changepass")
    .set("Authorization", "sshkjahska")
    .send({
      oldpass: "password",
      newpass: "123456789",
    })
    .expect(401);
});

it("should not change password with an expired authentication token with phone", async () => {
  setExpire(1);
  const { id, token } = await login("password", undefined, "09333333333");
  await global.delay(1000);
  await request(app)
    .put("/api/auth/changepass")
    .set("Authorization", token)
    .send({
      oldpass: "password",
      newpass: "123456789",
    })
    .expect(403);
});

it("should not change password with invalid passwords with email", async () => {
  const { id, token } = await login("password", "example@domain.com");

  await request(app)
    .put("/api/auth/changepass")
    .set("Authorization", token)
    .send({
      oldpass: "pass",
      newpass: "56789",
    })
    .expect(400);
});

it("should not change password with invalid passwords with phone", async () => {
  const { id, token } = await login("password", undefined, "09333333333");

  await request(app)
    .put("/api/auth/changepass")
    .set("Authorization", token)
    .send({
      oldpass: "pass",
      newpass: "56789",
    })
    .expect(400);
});

it("should not change password with wrong old password with email", async () => {
  const { id, token } = await login("password", "example@domain.com");

  await request(app)
    .put("/api/auth/changepass")
    .set("Authorization", token)
    .send({
      oldpass: "wrongpassword",
      newpass: "123456789",
    })
    .expect(400);
});

it("should not change password with wrong old password with phone", async () => {
  const { id, token } = await login("password", undefined, "09333333333");

  await request(app)
    .put("/api/auth/changepass")
    .set("Authorization", token)
    .send({
      oldpass: "wrongpassword",
      newpass: "123456789",
    })
    .expect(400);
});

it("should login after changing the password with email", async () => {
  const { id, token } = await login("password", "example@domain.com");

  await request(app)
    .put("/api/auth/changepass")
    .set("Authorization", token)
    .send({
      oldpass: "password",
      newpass: "123456789",
    })
    .expect(200);

  await login("123456789", "example@domain.com");
});

it("should login after changing the password with phone", async () => {
  const { id, token } = await login("password", undefined, "09333333333");

  await request(app)
    .put("/api/auth/changepass")
    .set("Authorization", token)
    .send({
      oldpass: "password",
      newpass: "123456789",
    })
    .expect(200);
  await login("123456789", undefined, "09333333333");
});
