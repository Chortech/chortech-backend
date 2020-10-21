import { Request, Response, NextFunction } from "express";
import { ErrorBase } from "../errors/errorBase";

/**
 * this middleware will handle incoming errors in express
 * if the error is an ErrorBase ( user defined errors )
 * will return result of serialize method in ErrorBase
 * to the user otherwise we're in an unpredicted state
 * so we first log the error and then respond with a
 * general 400 code and the meesage of "Something went wrong"
 */

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof ErrorBase) {
    res.status(err.status).json({ errors: err.serialize() });
  }

  console.error(err);
  res.status(400).json({ errors: ["Something went wrong!"] });
}
