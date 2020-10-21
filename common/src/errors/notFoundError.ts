import { ErrorBase } from "./errorBase";
/**
 * general purpose error for covering most of cases
 * with status of 400
 *
 */
export class NotFoundError extends ErrorBase {
  status = 404;
  constructor() {
    super("Resource Not Found!");

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serialize() {
    return [{ message: this.message }];
  }
}
