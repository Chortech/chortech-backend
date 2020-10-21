import { ErrorBase } from "./errorBase";
import Joi, { ValidationError as JoiValidationError } from "joi";

export class ValidationError extends ErrorBase {
  status = 400;
  error: JoiValidationError;
  constructor(error: JoiValidationError) {
    super("Invalid request body or parameters");
    this.error = error;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  serialize() {
    let errors = this.error.details.map((d) => {
      return {
        message: d.message,
        fields: d.context?.key ? [d.context?.key] : d.context?.peers,
      };
    });

    return errors;
  }
}
