import express from "express";

// this library helps throwing errors from async request handlers
// we dont need to write next(err) each we want to send an error
// to our error handling middleware.
import "express-async-errors";
import dotenv from "dotenv";
dotenv.config();
import { router as signupRouter } from "./routes/signup";
import { router as loginRouter } from "./routes/login";
import { router as resetpassRouter } from "./routes/resetpass";
import { router as changepassRouter } from "./routes/changepass";
import { router as verificationRouter } from "./routes/verification";
import { NotFoundError, errorHandler } from "@chortec/common";
import { changeEmailRouter } from "./routes/changeEmail";
import { changePhoneRouter } from "./routes/changePhone";

// setting up express
const app = express();
app.use(express.json());

// adding route handlers to express
app.use("/api/auth/signup", signupRouter);
app.use("/api/auth/login", loginRouter);
app.use("/api/auth/resetpass", resetpassRouter);
app.use("/api/auth/changepass", changepassRouter);
app.use("/api/auth/verification", verificationRouter);
app.use('api/auth/change-email', changeEmailRouter);
app.use('api/auth/change-phone', changePhoneRouter);

// if any of the above route handlers failed to run we need to show a 404 status code
app.get("*", (req, res) => {
  throw new NotFoundError();
});

// adding the error handling middleware
app.use(errorHandler);

// exporting app so we could run the server in different place
// this is mostly for making the test easier
export { app };
