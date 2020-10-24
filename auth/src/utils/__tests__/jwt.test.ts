import request from "supertest";
import { app } from "../../app";
import { Token, setExpire } from "../../utils/jwt";
import {
  verify,
  UnauthenticatedError,
  UnauthorizedError,
} from "@chortec/common";

it("should respond with 401 if the token is invalid", async () => {
  setExpire(1);
  const req = await request(app)
    .post("/api/auth/signup")
    .send({
      email: "example@domain.com",
      phone: "09333333333",
      name: "example123",
      password: "1234mypass4567",
    })
    .expect(201);

  const { token } = req.body;
  const { access } = token as Token;
  await expect(() => verify(access + "s")).rejects.toThrow(
    UnauthenticatedError
  );
});

it("should respond with 403 if the token is expired", async () => {
  setExpire(1);
  const delay = (ms: number) => new Promise((res, rej) => setTimeout(res, ms));
  const req = await request(app)
    .post("/api/auth/signup")
    .send({
      email: "example@domain.com",
      phone: "09333333333",
      name: "example123",
      password: "1234mypass4567",
    })
    .expect(201);

  const { token } = req.body;
  const { access } = token as Token;
  await delay(1000);
  await expect(() => verify(access)).rejects.toThrow(UnauthorizedError);
});
