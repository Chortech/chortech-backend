import { ErrorBase } from "./errorBase";

/**
 * this error is for when the access token is invalid
 */

export class UnauthenticatedError extends ErrorBase {
  status = 401;
  constructor() {
    super("Invalid Authentication token provided!");

    Object.setPrototypeOf(this, UnauthenticatedError.prototype);
  }

  serialize() {
    return [{ message: this.message }];
  }
}
