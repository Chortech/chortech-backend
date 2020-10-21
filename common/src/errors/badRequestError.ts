import { ErrorBase } from "./errorBase";
/**
 * general purpose error for covering most of cases
 * with status of 400
 *
 */
export class BadRequestError extends ErrorBase {
  status = 400;
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, BadRequestError.prototype);
  }

  serialize() {
    return [{ message: this.message }];
  }
}
