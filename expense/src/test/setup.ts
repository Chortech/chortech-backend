// setup file for test about user service
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import crypto from "crypto";

jest.mock("../utils/nats-wrapper");

interface SigninMockResponse {
  id: string;
  token: string;
}

declare global {
  function delay(ms: number): Promise<void>;
}

beforeAll(async () => {
  jest.setTimeout(10000);
  process.env.JWT_KEY = "abcdefghijk";
});

beforeEach(async () => {
  jest.clearAllMocks();
});

afterAll(async () => {});

global.delay = async (ms) => new Promise((res, rej) => setTimeout(res, ms));
