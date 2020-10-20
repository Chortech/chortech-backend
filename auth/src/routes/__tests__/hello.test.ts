import request from "supertest";
import { app } from "../../app";

it("shoud show a status of 200", async () => {
  await request(app).get("/api/hello").send().expect(200);
});

it("shoud show a status of 404", async () => {
  await request(app).get("/").send().expect(404);
  await request(app).get("/api").send().expect(404);
});

it("shoud have a text with string Hello World!", async () => {
  const res = await request(app).get("/api/hello").send();
  expect(res.text).toBe("Hello World!");
});
