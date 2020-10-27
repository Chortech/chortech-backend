import { NotFoundError, ResourceConflictError } from "@chortec/common";
import {
  generateCode,
  verifyCode,
  cancelCode,
  setTTL,
  getCode,
  length,
} from "../verification";

it(`should generate a code with length of ${length}`, async () => {
  const code = await generateCode("09123456789");
  await expect(() => verifyCode("132", code)).rejects.toThrow(NotFoundError);
  expect((await getCode("09123456789")).verified).toBe(false);
  expect(await verifyCode("09123456789", "123")).toBe(false);
  expect((await getCode("09123456789")).verified).toBe(false);
  expect(await verifyCode("09123456789", code)).toBe(true);
  expect((await getCode("09123456789")).verified).toBe(true);
});

it("should generate a code and verify it", async () => {
  const code = await generateCode("09123456789");
  await expect(() => verifyCode("132", code)).rejects.toThrow(NotFoundError);
  expect((await getCode("09123456789")).verified).toBe(false);
  expect(await verifyCode("09123456789", "123")).toBe(false);
  expect((await getCode("09123456789")).verified).toBe(false);
  expect(await verifyCode("09123456789", code)).toBe(true);
  expect((await getCode("09123456789")).verified).toBe(true);
});

it("should cancel a code and then fail to verify it", async () => {
  const code = await generateCode("09123456789");
  expect(await cancelCode("09123456789121")).toBe(false);
  expect(await cancelCode("09123456789")).toBe(true);
  await expect(() => verifyCode("09123456789", code)).rejects.toThrow(
    NotFoundError
  );
});

it("should not generate new code when there is already a code for given key", async () => {
  await generateCode("09123456789");
  await expect(() => generateCode("09123456789")).rejects.toThrow(
    ResourceConflictError
  );
});

it("should fail to verify an expired code", async () => {
  const delay = (ms: number) => new Promise((res, rej) => setTimeout(res, ms));

  setTTL(1);
  const code = await generateCode("09123456789");
  await delay(1000);
  await expect(() => verifyCode("09123456789", code)).rejects.toThrow(
    NotFoundError
  );
});

it("should fail to cancel an expired code", async () => {
  const delay = (ms: number) => new Promise((res, rej) => setTimeout(res, ms));

  setTTL(1);
  const code = await generateCode("09123456789");
  await delay(1000);
  expect(await cancelCode("09123456789")).toBe(false);
});
