import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.listen(4001, () => {
  console.log("🔐 Auth Service running on http://localhost:4001");
});