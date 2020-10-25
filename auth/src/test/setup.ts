// setup file for test about auth service
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import redis, { RedisClient } from "redis-mock";
jest.mock("redis", () => redis);
import { client } from "../utils/verification";
import { compare } from "bcrypt";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  process.env.JWT_KEY = "abcdefghij";

  mongo = new MongoMemoryServer();
  const uri = await mongo.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  client.flushall(async (s) => console.log(s));
  const collections = await mongoose.connection.db.collections();
  for (let col of collections) {
    await col.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});
