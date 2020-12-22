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
import helmet from "helmet";

const docpath = path.join(__dirname, "..", "docs", "main.yml");
const doc = YAML.parse(fs.readFileSync(docpath, "utf8"));
const port = process.env.PORT || 3000;
// setting up express
const app = express();
// app.use(helmet.contentSecurityPolicy());
// app.use(helmet.dnsPrefetchControl());
// app.use(helmet.expectCt());
// app.use(helmet.frameguard());
// app.use(helmet.hidePoweredBy());
// // app.use(helmet.hsts());
// app.use(helmet.ieNoOpen());
// app.use(helmet.noSniff());
// app.use(helmet.permittedCrossDomainPolicies());
// app.use(helmet.referrerPolicy());
// app.use(helmet.xssFilter());

// adding route handlers to express
app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(doc));

// if any of the above route handlers failed to run we need to show a 404 status code
app.get("*", (req, res) => {
  throw new NotFoundError();
});

// adding the error handling middleware
app.use(errorHandler);

app.listen(port, () =>
  console.log(`\x1b[32mServer is listening on port ${port}\x1b[0m`)
);
