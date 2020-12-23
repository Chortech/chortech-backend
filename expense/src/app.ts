import express from "express";

// this library helps throwing errors from async request handlers
// we dont need to write next(err) each we want to send an error
// to our error handling middleware.
import "express-async-errors";
import helmet from "helmet";
import { NotFoundError, errorHandler } from "@chortec/common";
import { router as createExpenseRouter } from "./routes/create-expense";
import { router as getExpensesRouter } from "./routes/get-expenses";
import { router as getExpenseRouter } from "./routes/get-expense";

// setting up express
const app = express();
app.use(express.json());
app.use(helmet());

// adding route handlers to express
app.use("/api/expense", createExpenseRouter);
app.use("/api/expense", getExpensesRouter);
app.use("/api/expense/:id", getExpenseRouter);

// if any of the above route handlers failed to run we need to show a 404 status code
app.get("*", (req, res) => {
  throw new NotFoundError();
});

// adding the error handling middleware
app.use(errorHandler);

// exporting app so we could run the server in different place
// this is mostly for making the test easier
export { app };
