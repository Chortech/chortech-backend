import request from "supertest";
import { app } from "../../app";
import { sendMailMock } from "../../test/setup";
import { redisWrapper } from "../../utils/redis-wrapper";

const code = "123456";

it("should be able to send a code as with email", async () => {
  await request(app)
    .post("/api/auth/verification/generate")
    .send({ email: "sssbbb@gmail.com" })
    .expect(201);

  expect(sendMailMock).toHaveBeenCalledTimes(1);
});

it("should not send when both email and phone are not defined", async () => {
  await request(app).post("/api/auth/verification/generate").send().expect(400);
});

it("should not generate code for the same email twice", async () => {
  await request(app)
    .post("/api/auth/verification/generate")
    .send({ email: "sssbbb@gmail.com" })
    .expect(201);
  await request(app)
    .post("/api/auth/verification/generate")
    .send({ email: "sssbbb@gmail.com" })
    .expect(409);
});

it("should not send the code as a respond", async () => {
  const { body } = await request(app)
    .post("/api/auth/verification/generate")
    .send({ email: "sssbbb@gmail.com" })
    .expect(201);

  expect(body.code).not.toBeDefined();
});

it("should be able to verify a code", async () => {
  await request(app)
    .post("/api/auth/verification/generate")
    .send({ email: "sssbbb@gmail.com" })
    .expect(201);

  await request(app)
    .post("/api/auth/verification/verify")
    .send({ email: "sssbbb@gmail.com", code: code })
    .expect(200);
});

it("should not verify a code after cancellation", async () => {
  await request(app)
    .post("/api/auth/verification/generate")
    .send({ email: "sssbbb@gmail.com" })
    .expect(201);

  await request(app)
    .delete("/api/auth/verification/cancel")
    .send({ email: "sssbbb@gmail.com" })
    .expect(202);

  await request(app)
    .post("/api/auth/verification/verify")
    .send({ email: "sssbbb@gmail.com", code: code })
    .expect(404);
});

it("should not verify a code after expiration", async () => {
  redisWrapper.ttl = 1;

  await request(app)
    .post("/api/auth/verification/generate")
    .send({ email: "sssbbb@gmail.com" })
    .expect(201);
  await global.delay(1000);
  await request(app)
    .post("/api/auth/verification/verify")
    .send({ email: "sssbbb@gmail.com", code: code })
    .expect(404);
});

it("should not verify a code that doesnt exist", async () => {
  await request(app)
    .post("/api/auth/verification/verify")
    .send({ email: "sssbbb@gmail.com", code: code })
    .expect(404);
});

it("should not verify when the code is wrong", async () => {
  await request(app)
    .post("/api/auth/verification/generate")
    .send({ email: "sssbbb@gmail.com" })
    .expect(201);
  await request(app)
    .post("/api/auth/verification/verify")
    .send({ email: "sssbbb@gmail.com", code: "12345678s9" })
    .expect(400);
});

it("should not cancel a code that doesnt exist", async () => {
  await request(app)
    .delete("/api/auth/verification/cancel")
    .send({ email: "sssbbb@gmail.com" })
    .expect(404);
});

it("should not cancel a code twice", async () => {
  await request(app)
    .post("/api/auth/verification/generate")
    .send({ email: "sssbbb@gmail.com" })
    .expect(201);

  await request(app)
    .delete("/api/auth/verification/cancel")
    .send({ email: "sssbbb@gmail.com" })
    .expect(202);

  await request(app)
    .delete("/api/auth/verification/cancel")
    .send({ email: "sssbbb@gmail.com" })
    .expect(404);
});

it("should not verify a code twice", async () => {
  await request(app)
    .post("/api/auth/verification/generate")
    .send({ email: "sssbbb@gmail.com" })
    .expect(201);

  await request(app)
    .post("/api/auth/verification/verify")
    .send({ email: "sssbbb@gmail.com", code: code })
    .expect(200);

  await request(app)
    .post("/api/auth/verification/verify")
    .send({ email: "sssbbb@gmail.com", code: code })
    .expect(400);
});

it("should not cancel a verified code", async () => {
  await request(app)
    .post("/api/auth/verification/generate")
    .send({ email: "sssbbb@gmail.com" })
    .expect(201);

  await request(app)
    .post("/api/auth/verification/verify")
    .send({ email: "sssbbb@gmail.com", code: code })
    .expect(200);

  await request(app)
    .delete("/api/auth/verification/cancel")
    .send({ email: "sssbbb@gmail.com" })
    .expect(409);
});
