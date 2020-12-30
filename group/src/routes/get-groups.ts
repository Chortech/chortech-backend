import Router from "express";
import { BadRequestError, NotFoundError, requireAuth } from "@chortec/common";
import Group, { GroupDoc } from "../models/group";
import mongoose from "mongoose";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  if (!req.user) throw new BadRequestError("Invalid state!");

  const groups = await Group.find({
    members: { $in: [new mongoose.Types.ObjectId(req.user?.id)] },
  }).populate("creator");

  const groupsObj: any[] = groups.map((x: GroupDoc) =>
    x.toObject({
      transform: function (doc, ret, options) {
        const id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.inActiveExpenses;
        delete ret.members;
        ret.id = id;
      },
    })
  );

  res.status(200).json(groupsObj);
});

export { router };
