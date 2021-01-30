import mongoose, { Schema, Document } from 'mongoose';

/**
 * @param email this is email
 * @param phone
 * @param name
 */

interface IUser {
  id: string
  email?: string;
  phone?: string;
  name: string;
  picture?: string;
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
    picture: String
  },
  {
    toJSON: {
      transform: function(doc, ret, options) {
        const id = ret._id;
        delete ret._id;
        delete ret.__v;
        const picture = ret.picture
        ? `${process.env.STORAGE_ENDPOINT}/${process.env.STORAGE_BUCKET}/${ret.picture}`
        : undefined;
        ret.picture = picture;
        ret.id = id;
      }
    }
  }
);

userSchema.statics.build = (user: IUser) => new User({
  ...user,
  _id: user.id,
});

const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export { User };

export default User;