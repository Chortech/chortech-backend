import { Router } from "express";
import { SchemaType, validate } from "@chortec/common";
const router = Router();

router.post(
  "/",
  () => validate(SchemaType.USER),
  async (req, res) => {
    res.send({});
  }
);

export { router };
