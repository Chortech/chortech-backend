import path from "path";

process.env.MONGOMS_SYSTEM_BINARY = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "mongodb-binaries",
  "4.4.0",
  "mongod.exe"
);
// process.env.MONGOMS_DEBUG = "1";
