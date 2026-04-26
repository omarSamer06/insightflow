import Workspace from "../models/Workspace.js";

const MEMBER_ROLES = new Set(["admin", "member"]);

/**
 * @returns {boolean} true if migration was applied in-memory (caller may save)
 */
export function normalizeWorkspaceMembersIfNeeded(workspace) {
  if (!workspace || !Array.isArray(workspace.members)) return false;
  if (workspace.members.length === 0) return false;
  const first = workspace.members[0];
  if (first && typeof first === "object" && first.user != null) {
    return false;
  }

  const out = [];
  const seen = new Set();
  for (const m of workspace.members) {
    const raw = m?._id || m;
    const uid = raw;
    if (!uid) continue;
    const key = String(uid);
    if (seen.has(key)) continue;
    seen.add(key);
    const isOwner = String(workspace.owner) === key;
    out.push({ user: uid, role: isOwner ? "admin" : "member" });
  }
  workspace.members = out;
  return true;
}

export function isValidMemberRole(r) {
  return MEMBER_ROLES.has(String(r).toLowerCase());
}

/**
 * @returns {'owner' | 'admin' | 'member' | null}
 */
export function getUserWorkspaceAccessRole(user, workspace) {
  if (!user?._id || !workspace) return null;
  if (String(user.workspace) !== String(workspace._id)) return null;
  if (String(workspace.owner) === String(user._id)) return "owner";
  for (const m of workspace.members || []) {
    if (m?.user && String(m.user) === String(user._id)) {
      return m.role === "admin" ? "admin" : "member";
    }
  }
  return null;
}

export function canInviteToWorkspace(user, workspace) {
  const r = getUserWorkspaceAccessRole(user, workspace);
  return r === "owner" || r === "admin";
}

export function canMutateWorkspaceData(user, workspace) {
  const r = getUserWorkspaceAccessRole(user, workspace);
  return r === "owner" || r === "admin";
}

/**
 * @param {import('mongoose').Types.ObjectId} workspaceId
 */
export async function loadWorkspaceForRequest(user, workspaceId) {
  if (!workspaceId) return null;
  const ws = await Workspace.findById(workspaceId);
  if (!ws) return null;
  if (String(user.workspace) !== String(ws._id)) return null;
  if (normalizeWorkspaceMembersIfNeeded(ws) && typeof ws.save === "function") {
    await ws.save();
  }
  return ws;
}

/**
 * @param {import('express').Request} user
 * @param {import('mongoose').Types.ObjectId} workspaceId
 * @param {import('express').Response} res
 * @param {() => any} [next]
 * @returns {Promise<any|null>} workspace or null (response already set)
 */
export async function getWorkspaceForUserOrFail(user, workspaceId, res) {
  const ws = await loadWorkspaceForRequest(user, workspaceId);
  if (!ws) {
    res.status(403);
    throw new Error("Invalid workspace access");
  }
  return ws;
}

export function isDuplicateMember(workspace, userId) {
  const id = String(userId);
  if (String(workspace.owner) === id) return true;
  return (workspace.members || []).some((m) => m?.user && String(m.user) === id);
}
