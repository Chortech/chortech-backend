/**
 * base class of error handling any user-defined types
 * should extend extend this class and define a status-
 * number and a message and they should implement serialize
 * method
 */

export abstract class ErrorBase extends Error {
  abstract status: number;

  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, ErrorBase.prototype);
  }

  abstract serialize(): { message: string; fields?: [string] }[];
}
