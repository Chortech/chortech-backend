import { app } from "./app";
import mongoose from "mongoose";

async function start() {
  if (!process.env.EMAIL) throw new Error("EMAIL is not defined!");
  if (!process.env.EMAIL_PASS) throw new Error("EMAIL_PASS is not defined!");
  if (!process.env.MAIL_SERVICE)
    throw new Error("MAIL_SERVICE is not defined!");

  // TODO check for enviornment variables and throw an error
  // when they dont exist
  const port = process.env.PORT || 3000;
  const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/chortec";

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
