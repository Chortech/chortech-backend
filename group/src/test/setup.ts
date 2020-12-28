import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/user";
import jwt from "jsonwebtoken";

jest.mock("../utils/nats-wrapper");

let mongo: MongoMemoryServer;

interface SigninMockResponse {
  id: string;
  token: string;
}

declare global {
  function delay(ms: number): Promise<void>;

  function signup(
    name: string,
    email?: string,
    phone?: string
  ): Promise<string>;

  function signin(
    id: string,
    email?: string,
    phone?: string
  ): Promise<SigninMockResponse>;
}
export const users = [
  {
    id: "",
    email: "example@domain.com",
    name: "example",
  },
  {
    id: "",
    email: "example2@domain.com",
    name: "example2",
  },

  {
    id: "",
    phone: "09123456789",
    name: "phonyy",
  },
  {
    id: "",
    phone: "09987654321",
    name: "phony2",
  },
];

beforeAll(async () => {
  jest.setTimeout(10000);
  process.env.JWT_KEY = "abcdefghijk";
  mongo = new MongoMemoryServer();
  const uri = await mongo.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
});

beforeEach(async () => {
  jest.clearAllMocks();
  const collections = await mongoose.connection.db.collections();
  for (let col of collections) {
    await col.deleteMany({});
  }

  for (const user of users) {
    const id = await global.signup(user.name, user.email, user.phone);
    user.id = id;
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});

global.delay = async (ms) => new Promise((res, rej) => setTimeout(res, ms));

global.signup = (
  name: string,
  email?: string,
  phone?: string
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const id = new mongoose.Types.ObjectId().toHexString();
      const user = User.build({
        id: id,
        name: name,
        email: email,
        phone: phone,
      });

      await user.save();

      resolve(id);
    } catch (err) {
      reject(err);
    }
  });
};

global.signin = (id: string, email?: string, phone?: string) => {
  return new Promise(async (resolve, reject) => {
    jwt.sign(
      { id, email, phone },
      process.env.JWT_KEY!,
      { algorithm: "HS256" },
      (err, token) => {
        if (err) return reject(err);
        resolve({ id, token: token! });
      }
    );
  });
};