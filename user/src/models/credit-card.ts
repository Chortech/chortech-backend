import mongoose, { Document, Schema } from 'mongoose';


interface ICreditCard {
    number: string,
    name: string
}

type CreditCardDoc = ICreditCard & Document;

interface CreditCardModel extends mongoose.Model<CreditCardDoc> {
    build(creditCard: ICreditCard): CreditCardDoc;
}

const creditCardSchema = new Schema({
    number: { type: String, unique: true },
    name: String
});

creditCardSchema.statics.build = (creditCard: ICreditCard) => new CreditCard(creditCard);

const CreditCard = mongoose.model<CreditCardDoc, CreditCardModel>('CreditCard', creditCardSchema);

export { CreditCardDoc, ICreditCard, CreditCard };

export default CreditCard;