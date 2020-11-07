import {
  BadRequestError,
  NotFoundError,
  ResourceConflictError,
} from "@chortec/common";
import generate from "./codeGenerator";
import { redisWrapper } from "../utils/redis-wrapper";

const length = 6;

interface CodeModel {
  code: string;
  verified: boolean;
}

const getCode = (key: string): Promise<CodeModel> => {
  return new Promise(async (resolve, reject) => {
    const code = await redisWrapper.getAsync(key);
    if (!code)
      return reject(new NotFoundError(`There is no code generated for ${key}`));
    resolve(JSON.parse(code) as CodeModel);
  });
};

const generateCode = (key: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const codee = await redisWrapper.getAsync(key);
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

      await redisWrapper.setEXAsync(
        key,
        JSON.stringify(model),
        redisWrapper.ttl
      );
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
        await redisWrapper.setEXAsync(
          key,
          JSON.stringify(codee),
          redisWrapper.ttlAfterVerify
        );
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
      let code = await redisWrapper.getAsync(key);
      if (code) {
        let parsed = JSON.parse(code) as CodeModel;
        if (parsed.verified)
          return reject(
            new ResourceConflictError(
              "The code you're trying to cancel has been already activated!"
            )
          );
      }
      resolve(await redisWrapper.delAsync(key));
    } catch (err) {
      reject(err);
    }
  });
};

const isVerified = async (key: string): Promise<boolean> =>
  (await getCode(key)).verified;

const removeVerified = async (key: string) => {
  if ((await getCode(key)).verified) return await redisWrapper.delAsync(key);
  throw new Error("Code not verified!");
};

export {
  generateCode,
  verifyCode,
  cancelCode,
  CodeModel,
  getCode,
  isVerified,
  length,
  removeVerified,
};
