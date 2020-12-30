import Router from "express";
import { BadRequestError, requireAuth, NotFoundError } from "@chortec/common";
import Group from "../models/group";
import { GroupDeletedPublisher } from "../publishers/group-deleted-publisher";
import { natsWrapper } from "../utils/nats-wrapper";

const router = Router();

router.delete("/", requireAuth, async (req, res) => {
  if (!req.user) throw new BadRequestError("Invalid state!");

  const group = await Group.findById(req.group?.id);

  if (!group)
    throw new NotFoundError(`No groups exist with the id ${req.group?.id}`);

  if (group.creator.toHexString() != req.user.id)
    throw new BadRequestError("You are not the owner of this group!");

  if (group.inActiveExpenses.length != 0)
    throw new BadRequestError(
      "You cannot delete this group because of existing active expenses!"
    );

  await Group.deleteOne(group);

  await new GroupDeletedPublisher(natsWrapper.client).publish({
    id: req.group!.id,
  });

  res.status(200).send({
    message: "Deleted the group successfully!",
  });
});

export { router as deleteGroupRouter };
