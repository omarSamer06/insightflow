import express from "express";

import { getWorkspaceMembers, inviteWorkspaceMember } from "../controllers/workspaceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/members", getWorkspaceMembers);
router.post("/invite", inviteWorkspaceMember);

export default router;
