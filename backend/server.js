import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import recordRoutes from "./routes/recordRoutes.js";

dotenv.config();

const app = express();

const corsOriginRaw = process.env.CORS_ORIGIN;
const corsOrigin = corsOriginRaw
  ? corsOriginRaw.split(",").map((o) => o.trim()).filter(Boolean)
  : true;

app.use(
  cors({
    origin: corsOrigin,
  })
);
app.use(express.json());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API running",
    data: null,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/records", recordRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      // Intentionally minimal startup log
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown startup error";
    console.error(message);
    process.exit(1);
  }
}

startServer();

