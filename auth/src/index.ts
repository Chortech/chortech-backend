import { app } from "./app";
import mongoose from "mongoose";

async function start() {
  if (!process.env.EMAIL)        throw new Error("EMAIL is not defined!");
  if (!process.env.EMAIL_PASS)   throw new Error("EMAIL_PASS is not defined!");
  if (!process.env.MAIL_SERVICE) throw new Error("MAIL_SERVICE is not defined!");
  if (!process.env.LINE_NUMBER)  throw new Error("LINE_NUMBER is not defined!");
  if (!process.env.SMS_SECRET)   throw new Error("SMS_SECRET is not defined!");
  if (!process.env.SMS_API_KEY)  throw new Error("SMS_API_KEY is not defined!");

  const port = process.env.PORT || 3000;
  const mongoURI = process.env.MONGO_URI || "mongodb://auth-mongo-srv:27017/auth";

  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (err) {
    console.log(err);
  }

  app.listen(port, () => console.log(`Server is listening on port ${port}`));
}

start();
