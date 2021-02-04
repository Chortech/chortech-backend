import mongoose, { Document, Schema } from "mongoose";

/**
 * @param email this is email
 * @param phone
 * @param name
 * @param password
 */

interface IUser {
  email?: string;
  phone?: string;
  name: string;
  password: string;
}

type UserDoc = IUser & Document;

interface UserModel extends mongoose.Model<UserDoc> {
  build(user: IUser): UserDoc;
}

const userSchema = new Schema({
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  name: String,
  password: { type: String, required: true },
});

userSchema.statics.build = (user: IUser) => new User(user);

const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export { User };

export default User;
