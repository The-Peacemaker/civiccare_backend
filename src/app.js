import express from "express";
import cors from "cors";
import complaintRoutes from "./routes/complaintRoutes.js";
import { notFound, errorHandler } from "./middlewares/validateComplaint.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());


// Test route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "CivicCare API is running",
  });
});

// Health check (useful for demo + frontend)
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "OK", time: new Date().toISOString() });
});

// Feature routes
app.use("/api/complaints", complaintRoutes);

// 404 + central error handler (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
