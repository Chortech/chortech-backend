import jwt, { SignOptions } from "jsonwebtoken";
import { UserPayload, verify } from "@chortec/common";
import fs from "fs";
import path from "path";

const joinedPath = path.join(__dirname, "..", "keys", "chortec.key");
const private_key = process.env.JWT_KEY || fs.readFileSync(joinedPath, "utf-8");

const issuer = "Chortec";
const audience = "chortect.com";
let expire = 60 * 60;
const algorithm = process.env.JWT_KEY ? "HS256" : "RS256";

const signOptions: SignOptions = {
  issuer,
  audience,
  algorithm,
};

interface Token {
  access: string;
  expires: number;
  created: number;
}

const setExpire = (exp: number) => (expire = exp);

const generateToken = async (
  payload: UserPayload,
  subject: string
): Promise<Token> => {
  return new Promise<Token>((resolve, reject) => {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expire;
    jwt.sign(
      { ...payload, exp },
      private_key,
      { ...signOptions, subject: subject },
      (err, token) => {
        if (err) reject(err);
        resolve({
          access: token!,
          expires: exp,
          created: iat,
        });
      }
    );
  });
};

export { setExpire, generateToken, Token };

// setExpire(60);

// generateToken({ id: "s" }, "sub").then((x) => {
//   console.log(x);
//   verify(x.access).then(console.log);
// });
