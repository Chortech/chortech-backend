import { Router } from 'express';
import { 
    BadRequestError,
    NotFoundError,
    ResourceConflictError,
    validate,
    requireAuth
} from '@chortec/common';
import CreditCard from '../models/credit-card';
import mongoose from 'mongoose';
import Joi from 'joi';
import User from '../models/user';


const router = Router();

const removeMyCreditCardSchema = Joi.object({
    cardId: Joi.string()
});

router.post('/', requireAuth, validate(removeMyCreditCardSchema), async(req, res) => {
    if (!req.user)
        throw new BadRequestError('Invalid State!');

    const { cardId } = req.body;
    
    if (!(CreditCard.exists({ _id: cardId })))
        throw new NotFoundError(`${cardId} does not exist!`);
    
    const id = mongoose.Types.ObjectId(cardId);

    const raw = await User.updateOne(
        {
            _id: req.user?.id,
            myCreditCards: { $in: [id] }
        },
        { $pull: { myCreditCards: id }}
    );

    if (raw.n === 0)
        throw new ResourceConflictError(`${cardId} is already in your cards list!`);
    
    const user = await User.findById(req.user.id);

    res.status(201).json({ user });
});

export { router as removeMyCreditCardRouter };