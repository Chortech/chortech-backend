import { requireAuth } from "@chortec/common";
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

beforeEach(async () => {
  await signupEmail();
  await signupPhone();
});

it("should not reset password when invalid email or phone are entered", async () => {
  await request(app)
    .put("/api/auth/resetpass")
    .send({ email: ";klsahksa", newpass: "123456789" })
    .expect(400);
  await request(app)
    .put("/api/auth/resetpass")
    .send({ phone: "sklahgjs", newpass: "123456789" })
    .expect(400);
});

it("should not reset password when email and phone are both provided", async () => {
  await request(app)
    .put("/api/auth/resetpass")
    .send({
      email: "example@domain.com",
      phone: "09333333333",
      newpass: "123456789",
    })
    .expect(400);
});

it("should not reset password without a newpass field", async () => {
  await request(app)
    .put("/api/auth/resetpass")
    .send({ email: "example@domain.com" })
    .expect(400);

  await request(app)
    .put("/api/auth/resetpass")
    .send({ phone: "09333333333" })
    .expect(400);
});

it("should not reset password when email is not verified", async () => {
  await request(app)
    .post("/api/verification/generate")
    .send({ email: "example@domain.com" })
    .expect(201);

  await request(app)
    .put("/api/auth/resetpass")
    .send({ email: "example@domain.com", newpass: "123456789" })
    .expect(400);
});

it("should not reset password when phone is not verified", async () => {
  await request(app)
    .post("/api/verification/generate")
    .send({ phone: "09333333333" })
    .expect(201);

  await request(app)
    .put("/api/auth/resetpass")
    .send({ phone: "09333333333", newpass: "123456789" })
    .expect(400);
});

it("should not reset password when no code is generated for email", async () => {
  await request(app)
    .put("/api/auth/resetpass")
    .send({ email: "example@domain.com", newpass: "123456789" })
    .expect(404);
});

it("should not reset password when no code is generated for phone", async () => {
  await request(app)
    .put("/api/auth/resetpass")
    .send({ phone: "09333333333", newpass: "123456789" })
    .expect(404);
});

it("should not reset password when the code is canceled for email", async () => {
  await request(app)
    .post("/api/verification/generate")
    .send({ email: "example@domain.com" })
    .expect(201);

  await request(app)
    .delete("/api/verification/cancel")
    .send({ email: "example@domain.com" })
    .expect(202);

  await request(app)
    .put("/api/auth/resetpass")
    .send({ email: "example@domain.com", newpass: "123456789" })
    .expect(404);
});

it("should not reset password when the code is canceled for phone", async () => {
  await request(app)
    .post("/api/verification/generate")
    .send({ phone: "09333333333" })
    .expect(201);
  await request(app)
    .delete("/api/verification/cancel")
    .send({ phone: "09333333333" })
    .expect(202);
  await request(app)
    .put("/api/auth/resetpass")
    .send({ phone: "09333333333", newpass: "123456789" })
    .expect(404);
});

it("should not reset password when wrong email is provided", async () => {
  await global.mockVerification("example@domain.com");

  await request(app)
    .put("/api/auth/resetpass")
    .send({ email: "examplee@domain.com", newpass: "123456789" })
    .expect(400);
});

it("should not reset password when wrong phone is provided", async () => {
  await global.mockVerification("09333333333");

  await request(app)
    .put("/api/auth/resetpass")
    .send({ phone: "09123456789", newpass: "123456789" })
    .expect(400);
});

it("should login with the new password after reseting password with email", async () => {
  await global.mockVerification("example@domain.com");

  await request(app)
    .put("/api/auth/resetpass")
    .send({ email: "example@domain.com", newpass: "123456789" })
    .expect(200);

  await request(app)
    .post("/api/auth/login")
    .send({ email: "example@domain.com", password: "123456789" })
    .expect(200);
});

it("should not login with the old password after reseting password with email", async () => {
  await global.mockVerification("example@domain.com");

  await request(app)
    .put("/api/auth/resetpass")
    .send({ email: "example@domain.com", newpass: "123456789" })
    .expect(200);

  await request(app)
    .post("/api/auth/login")
    .send({ email: "example@domain.com", password: "password" })
    .expect(401);
});

it("should login with the new password after reseting password with phone", async () => {
  await global.mockVerification("09333333333");

  await request(app)
    .put("/api/auth/resetpass")
    .send({ phone: "09333333333", newpass: "123456789" })
    .expect(200);

  await request(app)
    .post("/api/auth/login")
    .send({ phone: "09333333333", password: "123456789" })
    .expect(200);
});

it("should not login with the old password after reseting password with phone", async () => {
  await global.mockVerification("09333333333");

  await request(app)
    .put("/api/auth/resetpass")
    .send({ phone: "09333333333", newpass: "123456789" })
    .expect(200);

  await request(app)
    .post("/api/auth/login")
    .send({ phone: "09333333333", password: "password" })
    .expect(401);
});

it("should login 2 users after reseting their passwords", async () => {
  await global.mockVerification("09333333333");
  await global.mockVerification("example@domain.com");
  await request(app)
    .put("/api/auth/resetpass")
    .send({ email: "example@domain.com", newpass: "123456789" })
    .expect(200);

  await request(app)
    .put("/api/auth/resetpass")
    .send({ phone: "09333333333", newpass: "987654321" })
    .expect(200);

  await request(app)
    .post("/api/auth/login")
    .send({ email: "example@domain.com", password: "123456789" })
    .expect(200);

  await request(app)
    .post("/api/auth/login")
    .send({ phone: "09333333333", password: "987654321" })
    .expect(200);
});
