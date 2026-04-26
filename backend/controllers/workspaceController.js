import mongoose from "mongoose";

import User from "../models/User.js";
import Workspace from "../models/Workspace.js";
import {
  canInviteToWorkspace,
  isDuplicateMember,
  isValidMemberRole,
  loadWorkspaceForRequest,
  normalizeWorkspaceMembersIfNeeded,
} from "../utils/workspaceMembers.js";

function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
}

/**
 * GET /api/workspace/members
 */
export async function getWorkspaceMembers(req, res, next) {
  try {
    const user = req.user;
    if (!user?.workspace) {
      res.status(403);
      throw new Error("User is not assigned to a workspace");
    }

    const workspace = await Workspace.findById(user.workspace).exec();

    if (!workspace) {
      res.status(404);
      throw new Error("Workspace not found");
    }

    if (String(user.workspace) !== String(workspace._id)) {
      res.status(403);
      throw new Error("Invalid workspace access");
    }

    if (normalizeWorkspaceMembersIfNeeded(workspace)) {
      await workspace.save();
    }

    await workspace.populate("owner", "name email");
    await workspace.populate("members.user", "name email");

    const list = [];
    if (workspace.owner) {
      const o = workspace.owner;
      list.push({
        user: {
          id: o._id,
          name: o.name,
          email: o.email,
        },
        role: "owner",
      });
    }

    for (const m of workspace.members || []) {
      if (!m.user) continue;
      const u = m.user;
      if (String(u._id || u) === String(workspace.owner)) {
        continue;
      }
      list.push({
        user: {
          id: u._id,
          name: u.name,
          email: u.email,
        },
        role: m.role,
      });
    }

    res.status(200).json({
      success: true,
      message: "Members fetched",
      data: {
        workspaceId: workspace._id,
        name: workspace.name,
        members: list,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/workspace/invite
 * Body: { email, role? }
 */
export async function inviteWorkspaceMember(req, res, next) {
  let session;
  try {
    const actor = req.user;
    if (!actor?.workspace) {
      res.status(403);
      throw new Error("User is not assigned to a workspace");
    }

    const { email, role: roleIn } = req.body || {};
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      res.status(400);
      throw new Error("Valid email is required");
    }

    let inviteRole = String(roleIn || "member").toLowerCase();
    if (!isValidMemberRole(inviteRole)) {
      res.status(400);
      throw new Error("role must be admin or member");
    }

    if (normalizedEmail === String(actor.email || "").toLowerCase()) {
      res.status(400);
      throw new Error("You cannot invite yourself");
    }

    let workspace = await loadWorkspaceForRequest(actor, actor.workspace);
    if (!workspace) {
      res.status(403);
      throw new Error("Invalid workspace access");
    }

    if (!canInviteToWorkspace(actor, workspace)) {
      res.status(403);
      throw new Error("Only workspace owner or an admin can invite members");
    }

    const target = await User.findOne({ email: normalizedEmail });
    if (!target) {
      return res.status(200).json({
        success: true,
        message:
          "No user found with that email. Ask them to register first, then you can send another invite.",
        data: { invited: false, reason: "user_not_found" },
      });
    }

    if (String(target._id) === String(actor._id)) {
      res.status(400);
      throw new Error("You cannot invite yourself");
    }

    if (target.workspace && String(target.workspace) !== String(workspace._id)) {
      res.status(409);
      throw new Error("This user already belongs to another workspace");
    }

    if (isDuplicateMember(workspace, target._id)) {
      res.status(409);
      throw new Error("This user is already a member of this workspace");
    }

    session = await mongoose.startSession();
    session.startTransaction();
    const ws = await Workspace.findById(workspace._id).session(session);
    if (!ws) {
      res.status(404);
      throw new Error("Workspace not found");
    }
    normalizeWorkspaceMembersIfNeeded(ws);

    if (isDuplicateMember(ws, target._id)) {
      res.status(409);
      throw new Error("This user is already a member of this workspace");
    }

    ws.members.push({ user: target._id, role: inviteRole });
    await ws.save({ session });

    target.workspace = ws._id;
    await target.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "User added to the workspace",
      data: {
        invited: true,
        user: {
          id: target._id,
          email: target.email,
          name: target.name,
          role: inviteRole,
        },
      },
    });
  } catch (error) {
    if (session) {
      try {
        if (session.inTransaction()) await session.abortTransaction();
      } catch {
        // ignore
      }
    }
    next(error);
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch {
        // ignore
      }
    }
  }
}
