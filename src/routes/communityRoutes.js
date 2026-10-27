import { Router } from "express";
import * as communityController from "../controller/communityController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.route("/").get(communityController.list).post(requireAuth, communityController.create);
router.get("/:id", communityController.getById);
router.post("/:id/join", requireAuth, communityController.join);

export default router;
