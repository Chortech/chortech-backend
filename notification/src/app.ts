import express from "express";

// this library helps throwing errors from async request handlers
// we dont need to write next(err) each we want to send an error
// to our error handling middleware.
import "express-async-errors";
import helmet from "helmet";
import { NotFoundError, errorHandler } from "@chortec/common";
import { router as setFCMTokenRouter } from "./routes/set-fcm-token";
import { router as testRouter } from "./routes/test";
import morgan from "morgan";

// setting up express
const app = express();
app.use(express.json());
app.use(helmet());
app.use(morgan("combined"));

// adding route handlers to express
app.use("/api/notifications", setFCMTokenRouter);
app.use("/api/notifications/test", testRouter);

// adding the error handling middleware
app.use(errorHandler);

// exporting app so we could run the server in different place
// this is mostly for making the test easier
export { app };
