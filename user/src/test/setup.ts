// setup file for test about auth service
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
let mongo: MongoMemoryServer;

declare global {
  function delay(ms: number): Promise<void>;
}

global.delay = async (ms) => new Promise((res, rej) => setTimeout(res, ms));

beforeAll(async () => {
  jest.setTimeout(10000);
  mongo = new MongoMemoryServer({ binary: { version: "4.4.0" } });
  const uri = await mongo.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let col of collections) {
    await col.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});
