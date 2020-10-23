import jwt, { decode } from "jsonwebtoken";
import util from "util";
import mongoose from "mongoose";
import fs from "fs";

const private_key = fs.readFileSync("../keys/chortec.key", "utf-8");
const public_key = fs.readFileSync("../keys/chortec.key.pub", "utf-8");

const i = "Chortec"; // Issuer
const a = "chortect.com"; // Audience

// const signOptions = {
//   issuer: i,
//   subject: that is yet to be determined,
//   audience: a,
//   expiresIn: "1h",
//   algorithm: "RS256",
// };

class JWT {
  static generateToken(payload: any, subject: string): string {
    jwt.sign(payload, private_key, {
      expiresIn: "1m",
    });
    const token = jwt.sign(payload, private_key, {
      issuer: i,
      subject: subject,
      audience: a,
      expiresIn: "1h",
      algorithm: "RS256",
    });

    return token;
  }

  static verify(token: string): string | object {
    const decoded = jwt.verify(token, public_key, {
      issuer: i,
      audience: a,
      algorithms: ["RS256"],
    });
    return decoded;
  }
}

// const token = JWT.generateToken(
//   {
//     id: new mongoose.Types.ObjectId().toHexString(),
//     name: "myName",
//   },
//   "example@gmail.com"
// );

// console.log(token);
// console.log(JWT.verify(token));
