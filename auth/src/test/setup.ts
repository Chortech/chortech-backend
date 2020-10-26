// setup file for test about auth service
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import redis from "redis-mock";
import { MailOptions } from "nodemailer/lib/ses-transport";
const generateMock = () => "123456";
jest.mock("../utils/codeGenerator", () => generateMock);
jest.mock("redis", () => redis);
jest.mock("nodemailer");
const nodemailer = require("nodemailer");
export const sendMailMock = jest.fn((mailOptions, callback) => callback());
nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
import { client } from "../utils/verification";
let mongo: MongoMemoryServer;

declare global {
  function delay(ms: number): Promise<void>;
}

global.delay = async (ms) => new Promise((res, rej) => setTimeout(res, ms));

beforeAll(async () => {
  jest.setTimeout(10000);
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

  client.flushall();
  const collections = await mongoose.connection.db.collections();
  for (let col of collections) {
    await col.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});
