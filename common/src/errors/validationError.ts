import { ErrorBase } from "./errorBase";
import { ValidationError as JoiValidationError } from "joi";

export class ValidationError extends ErrorBase {
  status = 400;

  constructor(public error: JoiValidationError) {
    super("Invalid request body or parameters");

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
