import { app } from "./app";
import mongoose from "mongoose";

async function start() {
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
