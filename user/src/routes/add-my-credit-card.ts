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

const addMyCreditCardSchema = Joi.object({
    number: Joi.string(),
    name: Joi.string()
});

router.post('/', requireAuth, validate(addMyCreditCardSchema), async(req, res) => {
    if (!req.user)
        throw new BadRequestError('Invalid State!');

    const { number, name } = req.body;
    let id;
    
    if (!(await CreditCard.exists({ number: number }))) {
        const creditCard = CreditCard.build({
            number,
            name
        });

        const { _id } = await creditCard.save();
        id = _id;
    } else {
        id = await CreditCard.findOne({ number: number, name: name });
    }
    
    const raw = await User.updateOne(
        {
            _id: req.user?.id,
            myCreditCards: { $nin: [id] }
        },
        { $push: { myCreditCards: id }}
    );

    if (raw.n === 0)
        throw new ResourceConflictError(`Card with the number ${number} is already in your cards list!`);
    
    const user = await User.findById(req.user.id).populate('myCreditCards').populate('otherCreditCards').populate('friends');

    res.status(200).json({ user });
});

export { router as addMyCreditCardRouter };