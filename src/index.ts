import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { connectDB } from "./db/connect";
import usersRouter from "./routes/usersRouter";
import authRouter from "./routes/authRouter";
import postRouter from "./routes/postRouter";
import postsRouter from "./routes/postsRouter";

import cors from "cors";
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
dotenv.config();
connectDB();
app.use(express.json());

app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/post", postRouter);
app.use("/posts", postsRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Express + TypeScript!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
