import express from "express";
import { helloRouter } from "./routes/helloRoute";
import { router as signupRouter } from "./routes/signup";

// this library helps throwing errors from async request handlers
// we dont need to write next(err) each we want to send an error
// to our error handling middleware.
import "express-async-errors";

// setting up express
const app = express();
app.use(express.json());

// adding route handlers to express
app.use("/api/hello", helloRouter);
app.use("/api/auth/signup", signupRouter);

// if any of the above route handlers failed to run we need to show a 404 status code
app.get("*", (req, res) => {
  res.status(404).send("Resource not found!");
});

// exporting app so we could run the server in different place
// this is mostly for making the test easier
export { app };
