import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import complaintRoutes from "./routes/complaintRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import * as statsController from "./controller/statsController.js";
import { resolveCurrentUser } from "./middlewares/auth.js";
import { notFound, errorHandler } from "./middlewares/validateComplaint.js";
import { sanitizeRequest } from "./utils/sanitize.js";
import { ensureUploadDir, UPLOAD_DIR } from "./middlewares/upload.js";

const app = express();

// Security + parsing
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));
app.use(sanitizeRequest);

// Basic abuse protection (disabled during tests).
if (process.env.NODE_ENV !== "test") {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later" },
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message: "Too many auth attempts, please try again later" },
  });
  app.use("/api", apiLimiter);
  app.use("/api/auth", authLimiter);
}

// Resolve req.user for every request (JWT, or dev fallback when enabled).
app.use(resolveCurrentUser);

// Uploaded images are served statically.
ensureUploadDir();
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));

app.get("/", (req, res) => {
  res.status(200).json({ message: "CivicCare API is running" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "OK",
    uptime: Math.round(process.uptime()),
    time: new Date().toISOString(),
  });
});

// Feature routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
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
