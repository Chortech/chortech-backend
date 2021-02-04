import { UnauthenticatedError } from "../errors/unauthenticatedError";
import { Request, Response, NextFunction } from "express";
import fs from "fs";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import path from "path";
import { UnauthorizedError } from "../errors/unauthorizedError";

const joinedpath = path.join(__dirname, "..", "keys", "chortec.key.pub");
const public_key = fs.readFileSync(joinedpath, "utf-8");

interface JWTPayload {
  user: UserPayload;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  sub: string;
}

interface UserPayload {
  id: string;
  email?: string;
  phone?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

const verify = async (token: string): Promise<JWTPayload> => {
  return new Promise((resolve, reject) => {
    const secret = process.env.JWT_KEY || public_key;
    if (!secret) throw new Error("JWT Secret must be defined!!");

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        if (err instanceof TokenExpiredError)
          return reject(new UnauthorizedError());
        else return reject(new UnauthenticatedError());
      }
      const payload = decoded as any;
      const result = {
        user: {
          id: payload.id,
          email: payload.email,
          phone: payload.phone,
        },
        iat: payload.iat,
        exp: payload.exp,
        aud: payload.aud,
        iss: payload.iss,
        sub: payload.sub,
      };
      resolve(result);
    });
  });
};

const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers["authorization"] as string;
  if (!auth) {
    throw new UnauthenticatedError();
  }

  const token = auth.split(" ");
  const decoded = await verify(token[1]);
  req.user = decoded.user;
  next();
};

export { JWTPayload, UserPayload, requireAuth, verify };
