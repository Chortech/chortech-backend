import { userShema, SchemaType } from "./schema";
import { Request, Response, NextFunction } from "express";

const validate = (type: SchemaType) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  switch (type) {
    case SchemaType.USER:
      const { error } = userShema.validate(req.body);
      if (error) {
        console.log(error.message, error.name);
        throw new Error("Invalid Input");
      }

      return next();
    default:
      break;
  }
};

export { validate };
