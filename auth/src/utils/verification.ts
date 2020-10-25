import { NotFoundError, ResourceConflictError } from "@chortec/common";
import redis, { RedisClient } from "redis";
import util from "util";

let TTL = 60 * 2; // Time To Live
const host = process.env.REDIS_URL || "redis://127.0.0.1:6379";
let client: RedisClient;

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
const generate = (): string => Math.floor(Math.random() * 999999999) + "";

const setTTL = (seconds: number) => (TTL = seconds);

const generateCode = (key: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (await existsAsync(key))
        return reject(
          new ResourceConflictError(
            `There is a code already generated for ${key}.`
          )
        );

      let code = generate();
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

      if (codee.code === code) {
        codee.verified = true;
        await setAsync(key, JSON.stringify(codee));
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
      resolve(await delAsync(key));
    } catch (err) {
      reject(err);
    }
  });
};

const clientt = client!;

export {
  setTTL,
  generateCode,
  verifyCode,
  cancelCode,
  clientt as client,
  getAsync,
  CodeModel,
  getCode,
};

async function test() {
  const code = await generateCode("09395536558");
  console.log("code", code);
  setTimeout(
    async () => console.log(await getAsync("09395536558")),
    1000 * 60 * 2 + 1
  );
  // console.log(await verifyCode("09395536558", "sal;ska;"));
  // console.log(await verifyCode("09395536558", code));
  // await setEXAsync("sss", "sina shabani", 60);
}

// test();
