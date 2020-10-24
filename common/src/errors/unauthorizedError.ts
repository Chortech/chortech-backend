import { ErrorBase } from "./errorBase";

/**
 * this error is for when the access token is expired or for some reason its banned
 */

export class UnauthorizedError extends ErrorBase {
  status = 403;
  constructor() {
    super("You are not authorized to access this resource!");

    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }

  serialize() {
    return [{ message: this.message }];
  }
}
