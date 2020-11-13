import express from 'express';

// this library helps throwing errors from async request handlers
// we dont need to write next(err) each we want to send an error
// to our error handling middleware.
import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();
import { NotFoundError, errorHandler } from "@chortec/common";
import { validateId } from './utils/idValidator';
import { createGroupRouter } from './routes/createGroup';
import { addFriendsToGroupRouter } from './routes/addFriends';
import { deleteGroupRouter } from './routes/deleteGroup';
import { getGroupRouter } from './routes/getGroup';

// setting up express
const app = express();
app.use(express.json());
app.param('id', validateId);

// adding route handlers to express
app.use('/api/group/create', createGroupRouter);
app.use('/api/group/delete', deleteGroupRouter);
app.use('/api/group/:id/add', addFriendsToGroupRouter);
app.use('/api/group/:id', getGroupRouter);

// if any of the above route handlers failed to run we need to show a 404 status code
app.get('*', (req, res) => {
    throw new NotFoundError();
});

// adding the error handling middleware
app.use(errorHandler);

// exporting app so we could run the server in different place
// this is mostly for making the test easier
export { app };
