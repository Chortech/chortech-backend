import bcrypt from "bcrypt";
const saltrounds = 10;

export class Password {
  static async hash(data: string): Promise<string> {
    return bcrypt.hash(data, saltrounds);
  }

  static async compare(data: string, hash: string): Promise<boolean> {
    return bcrypt.compare(data, hash);
  }
}
