import { Router } from "express";
import * as statsController from "../controller/statsController.js";

const router = Router();

router.get("/overview", statsController.getOverview);
router.get("/map", statsController.getMapPins);

export default router;
