import mongoose, { Document, Schema } from "mongoose";
import { ICreditCard } from './credit-card';


interface IUser {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  picture?: string,
  friends: mongoose.Types.ObjectId[];
  myCreditCards: ICreditCard[];
  otherCreditCards: ICreditCard[];
}

type UserDoc = IUser & Document;

interface UserModel extends mongoose.Model<UserDoc> {
  build(user: IUser): UserDoc;
}

const userSchema = new Schema({
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  name: String,
  friends: [{ type: Schema.Types.ObjectId }],
  picture: String,
  myCreditCards: [{ type: String, ref: 'CreditCard' }],
  otherCreditCards: [{ type: String, ref: 'CreditCard' }]
});

userSchema.statics.build = (user: IUser) =>
  new User({
    ...user,
    _id: user.id,
  });

const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export { User };

export default User;
