import { BadRequestError } from "@chortec/common";
import { IParticipant, PRole } from "../models/participant";
import { Request, Response, NextFunction } from "express";
import { graph } from "./neo";

// Check if debtors, creditors and total price of this expense is equal
// if not its invalid and we should respond with an error. An example of
// something that should throw an error would be, total not equaling with
// how much debtors got money and creditors paid money.

const validatePriceFlow = (req: Request, res: Response, next: NextFunction) => {
  // if participants is null it means that we're updating
  // the expense and there is no request for change in participants/
  if (!req.body.participants) return next();

  // if participants is defined total must be defined as well.
  if (!req.body.total)
    throw new BadRequestError(
      "Can't update participants without defining total!"
    );

  const participants: IParticipant[] = req.body.participants;
  const expenseTotal: number = req.body.total;

  if (participants.length === 0)
    throw new BadRequestError("Expense must have at least one IParticipant!");

  const paid = participants
    .filter((p) => p.role === PRole.Creditor)
    .map((p) => p.amount)
    .reduce((a, b) => a + b, 0);

  const received = participants
    .filter((p) => p.role === PRole.Debtor)
    .map((p) => p.amount)
    .reduce((a, b) => a + b, 0);

  if (
    Math.abs(paid - received) > Number.EPSILON || // if paid and received are not equal
    Math.abs(paid - expenseTotal) > Number.EPSILON || // if paid and expense price are not equal
    Math.abs(received - expenseTotal) > Number.EPSILON // if received and expense price are not equal
  ) {
    throw new BadRequestError("Amount received must be eqaul to amount paid!");
  }

  next();
};

// checks the id of participants inside p with the users
// of database and if there is a conflict it will stop
// the operation.
const validateParticipants = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // if participants is null it means that we're updating
  // the expense and there is no request for change in participants/
  if (!req.body.participants) return next();

  // if participants is defined total must be defined as well.
  if (!req.body.total)
    throw new BadRequestError(
      "Can't update participants without defining total!"
    );

  const participants = req.body.participants;

  const result = await graph.run(
    `UNWIND $participants as p
    MATCH (u:User {id: p.id})
    RETURN COUNT(u) as count`,
    {
      participants,
    }
  );

  let count = result.records[0].get("count");
  if (participants.length != count)
    throw new BadRequestError("One of the participants doesn't exits!");

  next();
};

export { validatePriceFlow, validateParticipants };
