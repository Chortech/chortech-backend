import jwt from "jsonwebtoken";

class JWT {
  static create(
    payload: any,
    key: string
  ): { access: string; refresh: string } {
    return {
      access: "",
      refresh: "",
    };
  }
}
