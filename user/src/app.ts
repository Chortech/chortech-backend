import express from "express";

// this library helps throwing errors from async request handlers
// we dont need to write next(err) each we want to send an error
// to our error handling middleware.
import "express-async-errors";
import helmet from "helmet";
import { NotFoundError, errorHandler } from "@chortec/common";
import { router as addFriendRouter } from "./routes/add-friend";
import { router as removeFriendRouter } from "./routes/remove-friend";
import { router as getFriendsRouter } from "./routes/get-friends";
import { router as inviteRouter } from "./routes/invite-friend";
import { router as imageUploadRouter } from "./routes/image-upload";
import { getProfileRouter } from "./routes/get-profile";
import { validateId } from "./utils/idValidator";
import { editProfileRouter } from "./routes/edit-profile";
import { addMyCreditCardRouter } from "./routes/add-my-credit-card";
import { removeMyCreditCardRouter } from "./routes/remove-my-credit-card";
import { addOtherCreditCardRouter } from "./routes/add-other-credit-card";
import { removeOtherCreditCardRouter } from "./routes/remove-other-credit-card";

// setting up express
const app = express();
app.use(express.json());
app.use(helmet());
app.param("id", validateId);

// adding route handlers to express
app.use("/api/user/friends", getFriendsRouter);
app.use("/api/user/friends/invite", inviteRouter);
app.use("/api/user/friends", addFriendRouter);
app.use("/api/user/friends/:id", removeFriendRouter);
app.use("/api/user/profile", getProfileRouter);
app.use("/api/user/image/upload", imageUploadRouter);
app.use("/api/user/profile/edit", editProfileRouter);
app.use("/api/user/credit-card/my", addMyCreditCardRouter);
app.use("/api/user/credit-card/my", removeMyCreditCardRouter);
app.use("/api/user/credit-card/other", addOtherCreditCardRouter);
app.use("/api/user/credit-card/other", removeOtherCreditCardRouter);

// if any of the above route handlers failed to run we need to show a 404 status code
app.get("*", (req, res) => {
  throw new NotFoundError();
});

// adding the error handling middleware
app.use(errorHandler);

// exporting app so we could run the server in different place
// this is mostly for making the test easier
export { app };
