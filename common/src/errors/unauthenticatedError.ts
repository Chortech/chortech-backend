import { ErrorBase } from "./errorBase";

/**
 * this error is for when wrong or invalid credentials result is provided
 * the status is 401
 */

export class UnauthenticatedError extends ErrorBase {
  status = 401;
  constructor() {
    super("Invalid authentication credentials provided!");

    Object.setPrototypeOf(this, UnauthenticatedError.prototype);
  }

  serialize() {
    return [{ message: this.message }];
  }
}
