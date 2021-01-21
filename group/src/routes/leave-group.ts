import Router from "express";
import {
  BadRequestError,
  requireAuth,
  NotFoundError,
  GroupUpdateType,
  Action
} from "@chortec/common";
import { Group, GroupDoc } from "../models/group";
import mongoose from "mongoose";
import { GroupUpdatedPublisher } from "../publishers/group-updated-publisher";
import { natsWrapper } from "../utils/nats-wrapper";
import User from "../models/user";
import { GroupDeletedPublisher } from '../publishers/group-deleted-publisher';
import { ActivityGroupDeletedPublisher } from '../publishers/activity-group-deleted-publisher';
import { ActivityGroupLeftPublisher } from "../publishers/activity-group-left-publisher";

const router = Router();

router.delete('/', requireAuth, async (req, res) => {
  if (!req.user) throw new BadRequestError('Invalid State!');

  const exists = await Group.exists({ _id: req.group?.id });
  const user = mongoose.Types.ObjectId(req.user.id);
  let group: GroupDoc | null;
    
  if (!exists)
    throw new NotFoundError(`No groups exist with the id ${req.group?.id}`);

  if (await Group.exists({ _id: req.group?.id, members: { $size: 1 } })) {
    group = await Group.findById(req.group?.id);

    await new GroupDeletedPublisher(natsWrapper.client).publish({
      id: req.group!.id,
    });
  
    const user = await User.findById(req.user.id);
    let involved: string[] = [];
  
    for (let member of group?.members!)
      involved.push(member.toHexString());
  
    await new ActivityGroupDeletedPublisher(natsWrapper.client).publish({
      subject: { id: user?.id, name: user?.name! },
      object: { id: group?.id!, name: group?.name! },
      parent: undefined,
      action: Action.Deleted,
      involved: involved,
      data: undefined
    });

    await Group.deleteOne({ _id: req.group?.id });
    res.status(200).send('Deleted the group successfully!');
    return;
  }

  else if (await Group.exists({ _id: req.group?.id, inActiveExpenses: { $in: [user] } }))
    throw new BadRequestError('You cannot leave the group because you are a participant in an expense!');
  
  else if (await Group.exists({ _id: req.group?.id, members: { $nin: [user] } }))
    throw new BadRequestError('You are not a member of this group!');
  
  else if (await Group.exists({ _id: req.group?.id, creator: user })) {
    group = await Group.findById(req.group?.id); 
    
    group!.creator = group!.members[0].toHexString() != req.user.id ? group!.members[0] : group!.members[1];

    await group!.save();
  }
    
  const raw = await Group.updateOne(
    {
      _id: req.group?.id
    }, 
    { $pull: { members: user } }
  );

  if (raw.n === 0)
    throw new BadRequestError("Something went wrong when you tried to leave!");

  await new GroupUpdatedPublisher(natsWrapper.client).publish({
    id: group!.id,
    left: req.user.id,
    type: GroupUpdateType.LeaveGroup,
  });

  const gp = await Group.findById(req.group?.id);
  const usr = await User.findById(user);

  let involved: string[] = [];

  for (let member of gp?.members!)
    involved.push(member.toHexString());

  await new ActivityGroupLeftPublisher(natsWrapper.client).publish({
    subject: { id: usr?.id, name: usr?.name! },
    object: { id: gp?.id, name: gp?.name! },
    parent: undefined,
    action: Action.Left,
    involved: involved,
    data: undefined
  });

  res.status(200).send("You left the group successfully.");
});

export { router as leaveGroupRouter };
