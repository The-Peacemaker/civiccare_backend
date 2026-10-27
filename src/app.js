import express from "express";
import cors from "cors";
import complaintRoutes from "./routes/complaintRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import * as statsController from "./controller/statsController.js";
import { resolveCurrentUser } from "./middlewares/auth.js";
import { notFound, errorHandler } from "./middlewares/validateComplaint.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Resolve req.user for every request (auth module or dev fallback).
app.use(resolveCurrentUser);

// Test route
app.get("/", (req, res) => {
  res.status(200).json({ message: "CivicCare API is running" });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "OK", time: new Date().toISOString() });
});

// Feature routes
app.use("/api/complaints", complaintRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/notifications", notificationRoutes);

// Map pins alias for the map screen.
app.get("/api/map/pins", statsController.getMapPins);

// 404 + central error handler (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
