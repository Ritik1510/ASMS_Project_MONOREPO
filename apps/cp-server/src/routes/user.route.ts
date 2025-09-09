import { Router } from "express";
// import { verifyJWT } from "../middlewares/auth.middleware";
import {
  registerUser
} from "../controllers/user.controllers";

const userRouter: Router = Router();

// Registration route with multiple file uploads
userRouter.route("/register").post(registerUser);

// Login route
// router.route("/login").post(loginUser);

// Secured routes
// router.route("/logout").post(verifyJWT, logoutUser);
// router.route("/refresh-token").post(refreshAccessToken);

export default userRouter;
