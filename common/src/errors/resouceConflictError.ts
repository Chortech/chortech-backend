import { ErrorBase } from "./errorBase";
/**
 * general purpose error for covering most of cases
 * with status of 400
 *
 */
export class ResourceConflictError extends ErrorBase {
  status = 409;
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, ResourceConflictError.prototype);
  }

  serialize() {
    return [{ message: this.message }];
  }
}
