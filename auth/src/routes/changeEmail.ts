import { BadRequestError, validate, requireAuth, ResourceConflictError } from '@chortec/common';
import { Router } from 'express';
import { isVerified } from '../utils/verification';
import Joi from 'joi';
import User from '../models/user';


const router = Router();

const changeEmailSchema = Joi.object({
    newEmail: Joi.string().email()
});

router.put('/', requireAuth, validate(changeEmailSchema), async (req, res) => {
    if (!req.user)
        throw new BadRequestError('Invalid State!');

    const { newEmail } = req.body;
    const { id } = req.user;

    const user = await User.findById(id);

    if (!user)
        throw new BadRequestError('Invalid State!');

    const users = newEmail ? await User.find({ newEmail }) : null;

    if (users != null)
        throw new ResourceConflictError('This email has already been used!');
    
    if (!(await isVerified(newEmail)))
        throw new BadRequestError('Email is not verified!');

    user.email = newEmail;

    await user.save();

    res.status(200).send({
        message: 'Email changed successfully.'
    });
});

export { router as changeEmailRouter };