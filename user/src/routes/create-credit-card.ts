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

const addMyCreditCardSchema = Joi.object({
    number: Joi.string().min(16).max(16).required(),
    name: Joi.string().required()
});

router.post('/', requireAuth, validate(addMyCreditCardSchema), async (req, res) => {
    if (!req.user)
        throw new BadRequestError('Invalid State!');
    
    const { cardNumber, cardName } = req.body;

    const exists = await CreditCard.exists({
        number: { $exists: true, $eq: cardNumber }
    });

    if (exists)
        throw new ResourceConflictError('Credit Card already exists');
    
    const creditCard = CreditCard.build({
        number: cardName,
        name: cardName
    });

    const { _id } = await creditCard.save();

    res.status(201).json({ creditCard });
});