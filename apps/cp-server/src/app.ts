import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app: Application = express();

app.use(
   cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
   })
);

// json data response limit
app.use(express.json({ limit: "20kb" }));

app.use(express.urlencoded({ extended: true, limit: "20kb" }));

// this is for handling the public assets
app.use(express.static("public"));

// cookies set up
app.use(cookieParser());

// routing 
import userRouter from './routes/user.route';

app.use("/api/v1/users", userRouter);

export { app };