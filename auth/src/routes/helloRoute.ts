/**
 * Simple Router for begining the project
 */

// TODO delete this when the actual code for auth is written

import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello World!");
});

export { router as helloRouter };
