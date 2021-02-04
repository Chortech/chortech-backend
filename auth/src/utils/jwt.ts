import jwt, { SignOptions } from "jsonwebtoken";
import { UserPayload, verify } from "@chortec/common";
import fs from "fs";
import path from "path";

const joinedPath = path.join(__dirname, "..", "keys", "chortec.key");
const private_key = fs.existsSync(joinedPath)
  ? fs.readFileSync(joinedPath, "utf-8")
  : undefined;

const issuer = "Chortec";
const audience = "chortect.com";
let expire = 60 * 60;
const signOptions: SignOptions = {
  issuer,
  audience,
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
    const algorithm =
      process.env.JWT_PRIVATE_KEY || private_key ? "RS256" : "HS256";

    const secret =
      process.env.JWT_KEY || private_key || process.env.JWT_PRIVATE_KEY;
    if (!secret) throw new Error("JWT Secret must be defined!!");
    jwt.sign(
      { ...payload, exp },
      secret,
      { ...signOptions, algorithm, subject: subject },
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
