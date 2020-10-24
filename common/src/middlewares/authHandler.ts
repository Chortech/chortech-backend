import { UnauthenticatedError } from "../errors/unauthenticatedError";
import { Request, Response, NextFunction } from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import path from "path";

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
    jwt.verify(token, public_key, (err, decoded) => {
      if (err) reject(err);

      resolve(decoded as JWTPayload);
    });
  });
};

const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers["Authorization"] as string;

  if (auth) {
    throw new UnauthenticatedError();
  }

  const token = auth.split(" ");
  try {
    const decoded = await verify(token[1]);
    req.user = decoded.user;
  } catch (err) {
    throw new UnauthenticatedError();
  }
};

export { JWTPayload, UserPayload, requireAuth, verify };
