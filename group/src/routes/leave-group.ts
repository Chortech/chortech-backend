// import Router from 'express';
// import { BadRequestError, UnauthorizedError, requireAuth, NotFoundError } from '@chortec/common';
// import Group from '../models/group';


// const router = Router();

// router.delete('/', requireAuth, async (req, res) => {
//     if (!req.user) throw new BadRequestError('Invalid State!');

//     const group = await Group.findById(req.group?.id);
    
//     if (!group)
//         throw new NotFoundError(`No groups exist with the id ${req.group?.id}`);

//     if (group.expenseChecks.get(req.user.id))
//         throw new BadRequestError('You cannot leave the group because you are a participant in an expense!');
    
//     if (group.creator == req.user.id) {
//         if (!group.members || group.members?.length == 1) {
//             await Group.deleteOne(group);
//             res.status(200).send('You left the group successfully.');
//             return;
//         } else {
//             group.creator = group.members[0] != req.user.id ? group.members[0] : group.members[1];
//         }
//     }

//     const index = group.members ? group.members?.indexOf(req.user.id, 0) : -1;
//     if (index <= -1)
//         throw new BadRequestError('You are not a member of this group!');

//     group.members?.splice(index, 1);
//     group.expenseChecks.delete(req.user.id);

//     await group.save();

//     res.status(200).send('You left the group successfully.');
// });

// export { router as leaveGroupRouter };