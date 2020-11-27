import { Router } from 'express';
import mongoose from 'mongoose';
import Joi from 'joi';
import {
    BadRequestError,
    NotFoundError,
    requireAuth,
    ResourceConflictError,
    validate
} from '@chortec/common';
import CreditCard from '../models/credit-card';


const router = Router();

const createCreditCardSchema = Joi.object({
    number: Joi.string().min(16).max(16).required(),
    name: Joi.string().required()
}).label('body');

router.post('/', requireAuth, validate(createCreditCardSchema), async (req, res) => {
    if (!req.user)
        throw new BadRequestError('Invalid State!');
    
    const { number, name } = req.body;

    const exists = await CreditCard.exists({
        number: { $exists: true, $eq: number }
    });

    if (exists)
        throw new ResourceConflictError('Credit Card already exists');
    
    const creditCard = CreditCard.build({
        number: number,
        name: name
    });

    const { _id } = await creditCard.save();

    res.status(201).json({ creditCard });
});

export { router as createCreditCardRouter };