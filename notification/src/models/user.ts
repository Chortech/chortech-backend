import mongoose, { Document, Schema } from "mongoose";

/**
 * @param email this is email
 * @param phone
 * @param name
 * @param password
 */

interface IUser {
  id: string;
  token: string;
}

type UserDoc = IUser & Document;

interface UserModel extends mongoose.Model<UserDoc> {
  build(user: IUser): UserDoc;
}

const userSchema = new Schema({
  token: { type: String, required: true },
});

userSchema.statics.build = (user: IUser) => new User({ ...user, _id: user.id });

const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export { User };

export default User;
