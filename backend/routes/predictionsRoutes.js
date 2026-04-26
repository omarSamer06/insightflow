import express from "express";

import { getPredictions } from "../controllers/predictionsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getPredictions);

export default router;
