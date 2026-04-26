import { useCallback, useEffect, useMemo, useState } from "react";
import ShellLayout from "../components/ShellLayout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function roleBadgeClass(role) {
  if (role === "owner") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  if (role === "admin") return "border-indigo-500/30 bg-indigo-500/10 text-indigo-200";
  return "border-slate-500/30 bg-slate-500/10 text-slate-300";
}

function formatRoleLabel(role) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}

export default function Team() {
  const { user } = useAuth();
  const currentId = user?.id ? String(user.id) : "";

  const [members, setMembers] = useState([]);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const canInvite = useMemo(() => {
    if (!currentId) return false;
    const me = members.find((m) => m?.user?.id && String(m.user.id) === currentId);
    if (!me) return false;
    return me.role === "owner" || me.role === "admin";
  }, [members, currentId]);

  const loadMembers = useCallback(async () => {
    setLoadError("");
    setIsLoading(true);
    try {
      const res = await api.get("/workspace/members");
      const d = res?.data?.data;
      setMembers(d?.members || []);
      setWorkspaceName(d?.name || "");
    } catch (e) {
      setMembers([]);
      setLoadError(e?.response?.data?.message || e?.message || "Could not load team.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    const trimmed = String(email).trim().toLowerCase();
    if (!trimmed) {
      setInviteError("Enter an email address.");
      return;
    }
    setIsInviting(true);
    try {
      const res = await api.post("/workspace/invite", { email: trimmed, role: inviteRole });
      const d = res?.data?.data;
      const message = res?.data?.message || "Done.";
      if (d?.invited === false && d?.reason === "user_not_found") {
        setInviteSuccess(message);
        setEmail("");
        return;
      }
      setInviteSuccess(message);
      setEmail("");
      await loadMembers();
    } catch (err) {
      setInviteError(err?.response?.data?.message || err?.message || "Invite failed.");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <ShellLayout>
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">Team</p>
          <h1 className="ui-page-title">Members</h1>
          <p className="ui-subtitle mt-2 max-w-2xl">
            {workspaceName
              ? `Workspace: ${workspaceName}. View who has access and invite teammates.`
              : "View who has access to this workspace and invite teammates."}
          </p>
        </div>

        {canInvite && (
          <section className="ui-card p-5 sm:p-6">
            <h2 className="text-sm font-bold text-slate-100">Invite member</h2>
            <p className="mt-1 text-xs text-slate-500">They must already have an account. We’ll add them to this workspace.</p>
            {inviteSuccess ? (
              <div
                className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
                role="status"
              >
                {inviteSuccess}
              </div>
            ) : null}
            {inviteError ? (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
                {inviteError}
              </div>
            ) : null}
            <form onSubmit={handleInvite} className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-0 flex-1 sm:max-w-md">
                <label htmlFor="invite-email" className="ui-label">
                  Email
                </label>
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ui-input mt-1.5"
                  placeholder="colleague@company.com"
                  autoComplete="off"
                />
              </div>
              <div className="w-full sm:w-40">
                <label htmlFor="invite-role" className="ui-label">
                  Role
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="ui-input mt-1.5"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" disabled={isInviting} className="ui-btn-primary w-full sm:w-auto sm:shrink-0">
                {isInviting ? "Sending…" : "Invite"}
              </button>
            </form>
          </section>
        )}

        <section className="ui-card overflow-hidden">
          <div className="border-b border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent px-5 py-4">
            <h2 className="text-sm font-bold text-slate-100">People</h2>
            <p className="mt-0.5 text-xs text-slate-500">Roles: Owner and Admins can manage data; Members can view.</p>
          </div>

          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-2/3 rounded bg-white/10" />
                <div className="h-4 w-1/2 rounded bg-white/5" />
                <div className="h-4 w-3/4 rounded bg-white/5" />
              </div>
            </div>
          ) : loadError ? (
            <div className="p-6">
              <p className="text-sm text-rose-200" role="alert">
                {loadError}
              </p>
            </div>
          ) : members.length === 0 ? (
            <div className="p-6 text-sm text-slate-400">No members to display.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((row) => (
                    <tr
                      key={`${row.user?.id || row.user?._id}-${row.role}`}
                      className="border-b border-white/[0.04] transition hover:bg-white/[0.02] last:border-0"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-100">
                        {row.user?.name || "—"}
                        {row.user?.id && String(row.user.id) === currentId ? (
                          <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{row.user?.email || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${roleBadgeClass(
                            row.role
                          )}`}
                        >
                          {formatRoleLabel(row.role)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </ShellLayout>
  );
}
