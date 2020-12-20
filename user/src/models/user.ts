import mongoose, { Document, Schema, SchemaTypes } from "mongoose";
import { CreditCardDoc, ICreditCard } from "./credit-card";

interface IUser {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  picture?: string;
  friends: mongoose.Types.ObjectId[];
  myCreditCards: mongoose.Types.ObjectId[];
  otherCreditCards: mongoose.Types.ObjectId[];
}

type UserDoc = IUser & Document;

interface UserModel extends mongoose.Model<UserDoc> {
  build(user: IUser): UserDoc;
}

const userSchema = new Schema(
  {
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    name: String,
    friends: [{ type: Schema.Types.ObjectId }],
    picture: String,
    myCreditCards: [{ type: String, ref: "CreditCard" }],
    otherCreditCards: [{ type: String, ref: "CreditCard" }],
  },
  {
    toJSON: {
      // this function is used for get-friends route
      transform: function (doc, ret, options) {
        const id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.myCreditCards;
        delete ret.otherCreditCards;
        ret.id = id;

        for (const f of ret.friends) {
          delete f.friends;
        }
      },
    },
  }
);

userSchema.statics.build = (user: IUser) =>
  new User({
    ...user,
    _id: user.id,
  });

const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export { User };

export default User;
