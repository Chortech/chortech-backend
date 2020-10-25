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
const generate = (): string => Math.floor(Math.random() * 999999999) + "";

const setTTL = (ttl: number) => (TTL = ttl);

const generateCode = (key: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (await existsAsync(key))
        return reject(new Error(`key: ${key}} already exists`));

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
      const codee = await getAsync(key);
      if (!codee)
        return reject(new Error(`There is no code available for ${key}`));

      const model = JSON.parse(codee) as CodeModel;

      if (codee === code) {
        model.verified = true;
        await setAsync(key, JSON.stringify(model));
      }

      resolve(codee === code);
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

export { setTTL, generateCode, verifyCode, cancelCode };

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
