import { schema as singupSchema } from "./schemas/signup";
import { schema as loginSchema } from "./schemas/login";
import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";
import { ValidationError } from "@chortec/common";

/**
 * this is just for avoiding typos and making
 * we're just mappong each SchemaType to Schema
 * which is a JOI class for validations and stuff
 * populate this class and the map below it when
 * you added a new Schema for validation
 */

class SchemaType {
  static SINGUP = "signup";
  static LOGIN = "login";
}

const schemas = new Map<string, Schema>([
  [SchemaType.SINGUP, singupSchema],
  [SchemaType.LOGIN, loginSchema],
]);

/**
 * this middleware trys to validate the request body based on
 * schema type and returns a ValidationError if something goes
 * wrong
 *
 * @param type SchemaType
 * @throws validationError
 * @returns void
 *
 */

const validate = (type: string) => {
  const schema = schemas.get(type);

  if (!schema) throw new Error("Invalid Schema!");

  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);

    if (error) {
      throw new ValidationError(error);
    }

    return next();
  };
};

export { validate, SchemaType };
