import express from "express";
import { profileRouter } from './routes/profile';

// this library helps throwing errors from async request handlers
// we dont need to write next(err) each we want to send an error
// to our error handling middleware.
import "express-async-errors";
// import dotenv from "dotenv";
// dotenv.config();
import { NotFoundError, errorHandler } from "@chortec/common";

// setting up express
const app = express();
app.use(express.json());

// adding route handlers to express
app.use('/api/user/profile', profileRouter);

// if any of the above route handlers failed to run we need to show a 404 status code
app.get("*", (req, res) => {
  throw new NotFoundError();
});

// adding the error handling middleware
app.use(errorHandler);

// exporting app so we could run the server in different place
// this is mostly for making the test easier
export { app };
