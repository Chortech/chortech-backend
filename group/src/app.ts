import express from "express";

// this library helps throwing errors from async request handlers
// we dont need to write next(err) each we want to send an error
// to our error handling middleware.
import "express-async-errors";
import helmet from "helmet";
import { NotFoundError, errorHandler } from "@chortec/common";
import { validateId } from "./utils/idValidator";
import { createGroupRouter } from "./routes/create-group";
import { getGroupRouter } from "./routes/get-group";
import { router as getGroupsRouter } from "./routes/get-groups";
import { deleteGroupRouter } from "./routes/delete-group";
import { addMembersToGroupRouter } from "./routes/add-members";
import { leaveGroupRouter } from "./routes/leave-group";
import { removeMemberRouter } from "./routes/remove-member";
import { editGroupInfoRouter } from "./routes/edit-group-info";

// setting up express
const app = express();
app.use(express.json());
app.use(helmet());
app.param("id", validateId);

// adding route handlers to express
app.use("/api/groups/", createGroupRouter);
app.use("/api/groups/", getGroupsRouter);
app.use("/api/groups/:id", getGroupRouter);
app.use("/api/groups/:id", deleteGroupRouter);
app.use("/api/groups/:id/members", addMembersToGroupRouter);
app.use("/api/groups/:id/leave", leaveGroupRouter);
app.use("/api/groups/:id/members", removeMemberRouter);
app.use("/api/groups/:id", editGroupInfoRouter);

// if any of the above route handlers failed to run we need to show a 404 status code
app.get("*", (req, res) => {
  throw new NotFoundError();
});

// adding the error handling middleware
app.use(errorHandler);

// exporting app so we could run the server in different place
// this is mostly for making the test easier
export { app };
