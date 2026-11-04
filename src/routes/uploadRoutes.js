import { Router } from "express";
import * as uploadController from "../controller/uploadController.js";
import { requireAuth } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

router.post("/", requireAuth, upload.any(), uploadController.uploadImage);

export default router;
