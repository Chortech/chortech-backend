// setup file for test about auth service
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import redis from "redis-mock";
jest.mock("redis", () => redis);
const generateMock = () => "123456";
jest.mock("../utils/codeGenerator", () => generateMock);
import { TokenBody, TokenResponse } from "../utils/smsSender";
jest.mock("../utils/smsSender", () => {
  return {
    sendSMS: async (msg: string, phone: string): Promise<boolean> =>
      new Promise((res, rej) => res(true)),
    getToken: async (body: TokenBody): Promise<TokenResponse> =>
      new Promise((res, rej) =>
        res({ IsSuccessful: true, Message: "", TokenKey: "" })
      ),
  };
});
jest.mock("nodemailer");
jest.mock("../utils/nats-wrapper");
const nodemailer = require("nodemailer");
export const sendMailMock = jest.fn((mailOptions, callback) => callback());
nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
import { generateCode, verifyCode } from "../utils/verification";
import { redisWrapper } from "../utils/redis-wrapper";
let mongo: MongoMemoryServer;

declare global {
  function delay(ms: number): Promise<void>;
  function mockVerification(key: string): Promise<boolean>;
}

global.mockVerification = async (key: string): Promise<boolean> => {
  const code = await generateCode(key);
  return verifyCode(key, code);
};

global.delay = async (ms) => new Promise((res, rej) => setTimeout(res, ms));

beforeAll(async () => {
  jest.setTimeout(10000);
  redisWrapper.connect("");
  process.env.JWT_KEY = "abcdefghij";
  mongo = new MongoMemoryServer();
  const uri = await mongo.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  sendMailMock.mockClear();
  nodemailer.createTransport.mockClear();
  jest.clearAllMocks();
  redisWrapper.client.flushall();
  const collections = await mongoose.connection.db.collections();
  for (let col of collections) {
    await col.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});
