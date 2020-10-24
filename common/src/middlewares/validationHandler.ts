import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors/validationError";
import { Schema } from "joi";

/**
 * this middleware trys to validate the request body based on
 * Joi schema and returns a ValidationError if something goes
 * wrong
 *
 * @param schema Joi.Schema
 * @throws validationError
 * @returns void
 *
 */

export const validate = (schema: Schema) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = schema.validate(req.body);

  if (error) {
    throw new ValidationError(error);
  }

  return next();
};
