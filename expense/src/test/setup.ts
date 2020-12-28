// setup file for test about user service
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { exec } from "child_process";
import path from "path";
import util from "util";
import { graph } from "../utils/neo";
import { v4 as uuid } from "uuid";

jest.mock("../utils/nats-wrapper");

const exec1 = util.promisify(exec);
const script = path.join(__dirname, "neo4j-create.sh");
const userCount = 10;

interface SigninMockResponse {
  id: string;
  token: string;
}

declare global {
  function delay(ms: number): Promise<void>;
  function signup(name: string): Promise<string>;

  function signin(id: string): Promise<SigninMockResponse>;
}

const users: { id: string; name: string }[] = [];
for (let i = 0; i < userCount; i++) {
  users.push({ id: "", name: `namee${i}` });
}

function test() {
  return Promise.resolve(1);
}

beforeAll(async () => {
  process.env.JWT_KEY = "abcdefghijk";
  // const child = await exec1(`bash ${script} create`);
  // console.log(child.stdout);
  const neoUrl = process.env.NEO4J_URL || "bolt://localhost";
  const neoUsername = process.env.NEO4J_USERNAME || "neo4j";
  const neoPassword = process.env.NEO4J_PASSWORD || "neo4j";
  await graph.initSync(neoUrl, neoUsername, neoPassword);
  for (let i = 0; i < userCount; i++) {
    const id = await global.signup(users[i].name);
    users[i].id = id;
  }
  console.log(users);
});

beforeEach(async () => {
  await graph.clearExpectUsers();
  jest.clearAllMocks();
});

afterAll(async () => {
  await graph.clear();
  await graph.close();
});

global.delay = async (ms) => new Promise((res, rej) => setTimeout(res, ms));

global.signup = (name: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const id = uuid();
      await graph.createUser(id, name);
      resolve(id);
    } catch (err) {
      reject(err);
    }
  });
};

global.signin = (id: string): Promise<SigninMockResponse> => {
  return new Promise(async (resolve, reject) => {
    jwt.sign(
      { id },
      process.env.JWT_KEY!,
      { algorithm: "HS256" },
      (err, token) => {
        if (err) return reject(err);
        resolve({ id, token: token! });
      }
    );
  });
};

export { users };
