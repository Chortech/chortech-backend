import { BadRequestError, validate, requireAuth } from '@chortec/common';
import { Router } from 'express';
import User from '../models/user';


const router = Router();

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
        name: user.name,
        picture: user.picture
    });
});

export { router as getProfileRouter };