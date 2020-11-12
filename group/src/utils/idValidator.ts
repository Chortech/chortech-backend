import { BadRequestError, ValidationError } from "@chortec/common";
import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import mongoose from "mongoose";

declare global {
  namespace Express {
    interface Request {
      group?: { id: string };
    }
  }
}

export const validateId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!id) throw new BadRequestError('Id must defined!');
  if (!mongoose.isValidObjectId(id))
    throw new ValidationError(
      new Joi.ValidationError(
        'Id must be a valid mongodb ObjectId!',
        [{ context: { key: 'id' } }],
        id
      )
    );

  req.group = { id };
  return next();
};