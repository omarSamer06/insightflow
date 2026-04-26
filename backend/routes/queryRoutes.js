import express from "express";

import { postNaturalLanguageQuery } from "../controllers/queryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/", postNaturalLanguageQuery);

export default router;
