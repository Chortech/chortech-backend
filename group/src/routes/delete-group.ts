// import Router from 'express';
// import { BadRequestError, UnauthorizedError, requireAuth, NotFoundError } from '@chortec/common';
// import { validate } from '@chortec/common';
// import Joi from 'joi';
// import User from '../models/user';
// import Group from '../models/group';


// const router = Router();

// router.delete('/', requireAuth, async (req, res) => {
//     if (!req.user) throw new BadRequestError('Invalid state!');

//     const id = req.user;

//     const user = await User.findById(id);
//     const group = await Group.findById(req.group?.id);

//     if (!user)
//         throw new BadRequestError('Invalid state!');
    
//     if (!group)
//         throw new NotFoundError(`No groups exist with the id ${req.group?.id}`);
    
//     if (group.creator != user)
//         throw new BadRequestError('You are not the owner of this group!');
    
//     await Group.deleteOne(group);

//     res.status(200).send({
//         message: 'Deleted the group successfully!'
//     });
// });

// export { router as deleteGroupRouter };