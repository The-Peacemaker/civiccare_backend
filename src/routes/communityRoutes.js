import { Router } from "express";
import * as communityController from "../controller/communityController.js";
import { requireAuth } from "../middlewares/auth.js";
import {
  validateCommunity,
  validateCommunityUpdate,
} from "../middlewares/validateCommunity.js";

const router = Router();

router
  .route("/")
  .get(communityController.list)
  .post(requireAuth, validateCommunity, communityController.create);

router.post("/:id/join", requireAuth, communityController.join);

router
  .route("/:id")
  .get(communityController.getById)
  .patch(requireAuth, validateCommunityUpdate, communityController.update)
  .delete(requireAuth, communityController.remove);

export default router;
