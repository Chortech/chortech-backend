import express from "express";

// this library helps throwing errors from async request handlers
// we dont need to write next(err) each we want to send an error
// to our error handling middleware.
import "express-async-errors";
import { NotFoundError, errorHandler } from "@chortec/common";
import swaggerUI from "swagger-ui-express";
import fs from "fs";
import path from "path";
import YAML from "yamljs";

const docpath = path.join(__dirname, "..", "docs", "main.yml");
const doc = YAML.parse(fs.readFileSync(docpath, "utf8"));
const port = process.env.PORT || 3000;
// setting up express
const app = express();

// adding route handlers to express
app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(doc));

// if any of the above route handlers failed to run we need to show a 404 status code
app.get("*", (req, res) => {
  throw new NotFoundError();
});

// adding the error handling middleware
app.use(errorHandler);

app.listen(port, () => console.log(`Server is listening on port ${port}`));