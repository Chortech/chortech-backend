import { signupSchema, loginSchema, SchemaType } from "../validations/schema";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors/validationError";

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

const validate = (type: SchemaType) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  switch (type) {
    case SchemaType.SINGUP:
      {
        const { error } = signupSchema.validate(req.body);

        if (error) {
          throw new ValidationError(error);
        }

        return next();
      }
      break;
    case SchemaType.LOGIN:
      {
        const { error } = loginSchema.validate(req.body);

        if (error) {
          throw new ValidationError(error);
        }

        return next();
      }
      break;
    default:
      break;
  }
};

export { validate };
