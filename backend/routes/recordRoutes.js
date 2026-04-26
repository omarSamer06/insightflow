import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import {
  createRecord,
  deleteRecord,
  getRecords,
  updateRecord,
} from "../controllers/recordController.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createRecord).get(getRecords);
router.route("/:id").put(updateRecord).delete(deleteRecord);

export default router;

