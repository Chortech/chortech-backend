import {
  BadRequestError,
  NotFoundError,
  ResourceConflictError,
} from "@chortec/common";
import { json } from "express";
import redis, { RedisClient } from "redis";
import util from "util";
import generate from "./codeGenerator";

let TTL = 60 * 2; // Time To Live
let TTLAfterVerify = 60 * 5; // Time To Live
const host = process.env.REDIS_URL || "redis://127.0.0.1:6379";
let client: RedisClient;
const length = 6;

interface CodeModel {
  code: string;
  verified: boolean;
}

if (!client!) {
  console.log("creating a redis client...");
  client = redis.createClient(host);
  client.on("error", (error) => console.log(error));
  client.on("connect", function () {
    console.log("connected to redis server.");
  });
}

const getAsync = util.promisify(client!.get).bind(client!);
const setAsync = util.promisify(client!.set).bind(client!);
const setEXAsync = (key: string, value: string, exp: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    client.set(key, value, "EX", exp, (err, reply) => {
      if (err) return reject(err);

      resolve();
    });
  });
};
const existsAsync = (key: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    client.exists(key, (err, result) => {
      if (err) return reject(err);
      resolve(result === 1);
    });
  });
};
const delAsync = (key: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    client.del(key, (err, result) => {
      if (err) return reject(err);

      resolve(result === 1);
    });
  });
};
const getCode = (key: string): Promise<CodeModel> => {
  return new Promise(async (resolve, reject) => {
    const code = await getAsync(key);
    if (!code)
      return reject(new NotFoundError(`There is no code generated for ${key}`));
    resolve(JSON.parse(code) as CodeModel);
  });
};

const setTTL = (seconds: number) => (TTL = seconds);
const setTTLAfterVerify = (seconds: number) => (TTLAfterVerify = seconds);

const generateCode = (key: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const codee = await getAsync(key);
      if (codee) {
        const parsed = JSON.parse(codee) as CodeModel;
        if (parsed.verified)
          return reject(new ResourceConflictError(`User is already verified!`));
        return reject(
          new ResourceConflictError(
            `There is a code already generated for ${key}.`
          )
        );
      }

      let code = generate(length);
      const model: CodeModel = {
        code: code,
        verified: false,
      };

      await setEXAsync(key, JSON.stringify(model), TTL);
      resolve(code);
    } catch (err) {
      reject(err);
    }
  });
};

const verifyCode = (key: string, code: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try {
      const codee = await getCode(key);
      if (codee.verified)
        return reject(new BadRequestError(`${key} has already been verified!`));
      if (codee.code === code) {
        codee.verified = true;
        await setEXAsync(key, JSON.stringify(codee), TTLAfterVerify);
      }

      resolve(codee.code === code);
    } catch (err) {
      reject(err);
    }
  });
};

const cancelCode = (key: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try {
      let code = await getAsync(key);
      if (code) {
        let parsed = JSON.parse(code) as CodeModel;
        if (parsed.verified)
          return reject(
            new ResourceConflictError(
              "The code you're trying to cancel has been already activated!"
            )
          );
      }
      resolve(await delAsync(key));
    } catch (err) {
      reject(err);
    }
  });
};

const isVerified = async (key: string): Promise<boolean> =>
  (await getCode(key)).verified;

const removeVerified = async (key: string) => {
  if ((await getCode(key)).verified) return await delAsync(key);
  throw new Error("Code not verified!");
};

const clientt = client!;

export {
  setTTL,
  setTTLAfterVerify,
  generateCode,
  verifyCode,
  cancelCode,
  clientt as client,
  getAsync,
  CodeModel,
  getCode,
  isVerified,
  length,
  removeVerified
};
