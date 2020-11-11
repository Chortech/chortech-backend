import { BadRequestError, validate, requireAuth } from '@chortec/common';
import { Router } from 'express';
import Joi from 'joi';
import User from '../models/user';


const router = Router();

const editProfileSchema = Joi.object({
    newName: Joi.string()
});

router.get('/', requireAuth, async (req, res) => {
    if (!req.user)
        throw new BadRequestError('Invalid State!');

    const { id } = req.user;
    const user = await User.findById(id);

    if (!user)
        throw new BadRequestError('Invalid State!');

    res.status(200).send({
        email: user.email,
        phone: user.phone,
        name: user.name
    });
});

router.put('/edit', requireAuth, validate(editProfileSchema), async (req, res) => {
    if (!req.user)
        throw new BadRequestError('Invalid State!');

    const { newName } = req.body;
    const { id } = req.user;

    const user = await User.findById(id);

    if (!user)
        throw new BadRequestError('Invalid State!');

    user.name = newName;

    await user.save();

    res.status(200).send({
        message: 'Profile edited successfully.'
    });
});

export { router as profileRouter };