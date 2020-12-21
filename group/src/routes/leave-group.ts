// import Router from 'express';
// import { BadRequestError, UnauthorizedError, requireAuth, NotFoundError } from '@chortec/common';
// import User from '../models/user';
// import Group from '../models/group';


// const router = Router();

// router.delete('/', requireAuth, async (req, res) => {
//     if (!req.user) throw new BadRequestError('Invalid State!');

//     const id = req.user;

//     const user = await User.findById(id);
//     const group = await Group.findById(req.group?.id);

//     if (!user)
//         throw new BadRequestError('Invalid state!');
    
//     if (!group)
//         throw new NotFoundError(`No groups exist with the id ${req.group?.id}`);

//     if (user.expenseCheck)
//         throw new BadRequestError('You cannot leave the group because you are a participant in an expense!');
    
//     if (group.creator == user) {
//         if (!group.members || group.members?.length == 1) {
//             await Group.deleteOne(group);
//             res.status(200).send('You left the group successfully.');
//             return;
//         } else {
//             group.creator = group.members[0] != user ? group.members[0] : group.members[1];
//         }
//     }

//     const index = group.members ? group.members?.indexOf(user, 0) : -1;
//     if (index <= -1)
//         throw new BadRequestError('You are not a member of this group!');

//     group.members?.splice(index, 1);

//     await group.save();

//     res.status(200).send('You left the group successfully.');
// });

// export { router as leaveGroupRouter };