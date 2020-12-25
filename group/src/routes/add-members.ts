// import Router from 'express';
// import { BadRequestError, ResourceConflictError, requireAuth, NotFoundError } from '@chortec/common';
// import { validate } from '@chortec/common';
// import Joi from 'joi';
// import Group from '../models/group';
// import User from '../models/user';


// const router = Router();

// const addMembersToGroupSchema = Joi.object({
//     members: Joi.array().items(Joi.string())
// }).label('body');

// router.put('/', requireAuth, validate(addMembersToGroupSchema), async (req, res) => {
//   if (!req.user) throw new BadRequestError('Invalid state!');

//   const { members } = req.body;

//   const group = await Group.findById(req.group?.id);

//   if (!group)
//     throw new NotFoundError(`No groups exist with the id ${req.group?.id}`);
  
//   if (!group.members?.includes(req.user.id))
//     throw new BadRequestError('You are not a member of this group!');
  
//   for (let memberId of members) {
//     if (!(await User.exists({ _id: memberId })))
//       throw new BadRequestError(`There is no user with id ${memberId}`);

//     if (group.members?.includes(memberId))
//       throw new ResourceConflictError(`User ${memberId} is already in this group!`);

//     group.members?.push(memberId);
//     group.expenseChecks.set(memberId, false);
//   }

//   await group.save();

//   res.status(200).send({
//     name: group.name,
//     creator: group.creator,
//     members: group.members
//   });
// });

// export { router as addMembersToGroupRouter };