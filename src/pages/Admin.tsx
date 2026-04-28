import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Link2, Search, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import StarField from "@/components/StarField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  full_name: string | null;
  nickname: string | null;
};

type GuestIdentity = {
  sessionId: string;
  names: string[];
  hostedLobbies: number;
  playerSlots: number;
};

type AdminListUsersRpc = (
  fn: "admin_list_users",
  args?: Record<string, never>
) => Promise<{ data: AdminUser[] | null; error: { message: string } | null }>;

type AdminLinkRpc = (
  fn: "admin_link_guest_data",
  args: { p_session_ids: string[]; p_target_user_id: string }
) => Promise<{ data: { success?: boolean; error?: string; hosted_lobbies?: number; player_slots?: number } | null; error: { message: string } | null }>;

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useIsAdmin();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [identities, setIdentities] = useState<GuestIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userQuery, setUserQuery] = useState("");
  const [linkTarget, setLinkTarget] = useState<GuestIdentity | null>(null);
  const [pickedUserId, setPickedUserId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isAdmin) navigate("/", { replace: true });
  }, [roleLoading, isAdmin, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, playersRes, lobbiesRes] = await Promise.all([
        supabase.rpc("admin_list_users"),
        supabase.from("lobby_players").select("session_id, player_name").is("user_id", null),
        supabase.from("lobbies").select("host_session_id, host_name").is("host_user_id", null),
      ]);

      if (usersRes.error) {
        console.error("admin_list_users failed:", usersRes.error);
        toast.error(`Users: ${usersRes.error.message}`);
      } else if (usersRes.data) {
        setUsers(usersRes.data as AdminUser[]);
      }

      if (playersRes.error) console.error("lobby_players query failed:", playersRes.error);
      if (lobbiesRes.error) console.error("lobbies query failed:", lobbiesRes.error);

      const map = new Map<string, GuestIdentity>();
      for (const p of playersRes.data ?? []) {
        if (!p.session_id) continue;
        const it = map.get(p.session_id) ?? { sessionId: p.session_id, names: [], hostedLobbies: 0, playerSlots: 0 };
        it.playerSlots++;
        if (p.player_name && !it.names.includes(p.player_name)) it.names.push(p.player_name);
        map.set(p.session_id, it);
      }
      for (const h of lobbiesRes.data ?? []) {
        if (!h.host_session_id) continue;
        const it = map.get(h.host_session_id) ?? { sessionId: h.host_session_id, names: [], hostedLobbies: 0, playerSlots: 0 };
        it.hostedLobbies++;
        if (h.host_name && !it.names.includes(h.host_name)) it.names.push(h.host_name);
        map.set(h.host_session_id, it);
      }
      setIdentities(
        Array.from(map.values()).sort(
          (a, b) => (b.hostedLobbies + b.playerSlots) - (a.hostedLobbies + a.playerSlots)
        )
      );
    } catch (e) {
      console.error("Admin load failed:", e);
      toast.error(e instanceof Error ? e.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.nickname?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q)
    );
  }, [users, userQuery]);

  const openLink = (it: GuestIdentity) => {
    setLinkTarget(it);
    setPickedUserId("");
  };

  const performLink = async () => {
    if (!linkTarget || !pickedUserId) return;
    setBusy(true);
    const linkRpc = supabase.rpc as unknown as AdminLinkRpc;
    const { data, error } = await linkRpc("admin_link_guest_data", {
      p_session_ids: [linkTarget.sessionId],
      p_target_user_id: pickedUserId,
    });
    setBusy(false);
    if (error || !data?.success) {
      toast.error(error?.message ?? data?.error ?? "Failed to link");
      return;
    }
    toast.success(
      `Linked: ${data.hosted_lobbies ?? 0} hosted, ${data.player_slots ?? 0} player slots`
    );
    setLinkTarget(null);
    setPickedUserId("");
    load();
  };

  if (roleLoading || !isAdmin) {
    return (
      <div className="min-h-screen relative">
        <StarField />
        <div className="relative z-10 p-12 text-center font-display text-sm uppercase tracking-[0.15em] text-muted-foreground">
          Checking access…
        </div>
      </div>
    );
  }

  const userLabel = (u: AdminUser) =>
    u.nickname || u.full_name || u.email || u.id.slice(0, 8);

  return (
    <div className="min-h-screen relative">
      <StarField />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-6 font-display text-sm uppercase tracking-[0.15em] text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Home
          </Button>

          <h1 className="font-display text-3xl md:text-4xl font-black tracking-[0.15em] text-primary text-glow text-center mb-2 flex items-center justify-center gap-3">
            <Shield className="h-7 w-7" /> Admin
          </h1>
          <div className="imperial-divider w-48 mx-auto mb-8" />
        </motion.div>

        {/* Unclaimed guest identities */}
        <section className="mb-10">
          <h2 className="font-display text-lg uppercase tracking-[0.15em] text-primary mb-3">
            Unclaimed Guest Identities ({identities.length})
          </h2>
          <div className="glass imperial-border rounded p-4">
            {loading ? (
              <p className="font-body text-sm text-muted-foreground text-center py-4">Loading…</p>
            ) : identities.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-4">
                Nothing unclaimed.
              </p>
            ) : (
              <div className="space-y-2">
                {identities.map((it) => (
                  <div
                    key={it.sessionId}
                    className="flex items-start justify-between gap-3 rounded border border-border bg-background/40 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-body text-sm text-foreground truncate">
                        {it.names.length > 0 ? it.names.join(", ") : "(no name)"}
                      </div>
                      <div className="font-body text-xs text-muted-foreground">
                        {it.hostedLobbies > 0 && (
                          <>Host of {it.hostedLobbies} {it.hostedLobbies === 1 ? "lobby" : "lobbies"} · </>
                        )}
                        {it.playerSlots} player {it.playerSlots === 1 ? "slot" : "slots"}
                      </div>
                      <div className="font-body text-[10px] text-muted-foreground/70 mt-1">
                        <code>{it.sessionId}</code>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openLink(it)}
                      className="font-display text-xs uppercase tracking-[0.15em]"
                    >
                      <Link2 className="mr-1 h-3 w-3" /> Link
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Users */}
        <section>
          <h2 className="font-display text-lg uppercase tracking-[0.15em] text-primary mb-3">
            Users ({users.length})
          </h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, nickname, or full name…"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="pl-9 glass imperial-border"
            />
          </div>
          <div className="glass imperial-border rounded overflow-hidden">
            {filteredUsers.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-6">
                No users match.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-body text-sm text-foreground truncate">
                        {u.nickname ?? u.full_name ?? "(no profile)"}{" "}
                        <span className="text-muted-foreground">· {u.email}</span>
                      </div>
                      <div className="font-body text-[10px] text-muted-foreground/70">
                        <code>{u.id}</code>
                      </div>
                    </div>
                    <div className="font-body text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Link dialog */}
      <Dialog open={!!linkTarget} onOpenChange={(o) => !o && setLinkTarget(null)}>
        <DialogContent className="glass imperial-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg uppercase tracking-[0.15em] text-primary">
              Link guest identity to user
            </DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              {linkTarget && (
                <>
                  Assign <strong>{linkTarget.names.join(", ") || "(no name)"}</strong>{" "}
                  ({linkTarget.hostedLobbies} hosted, {linkTarget.playerSlots} player slots)
                  to a user account.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto space-y-1 py-2">
            {users.map((u) => {
              const picked = pickedUserId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setPickedUserId(u.id)}
                  className={`w-full text-left rounded border p-2 transition ${
                    picked ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/40"
                  }`}
                >
                  <div className="font-body text-sm text-foreground truncate">{userLabel(u)}</div>
                  <div className="font-body text-xs text-muted-foreground truncate">{u.email}</div>
                </button>
              );
            })}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setLinkTarget(null)}
              disabled={busy}
              className="font-display text-xs uppercase tracking-[0.15em]"
            >
              Cancel
            </Button>
            <Button
              onClick={performLink}
              disabled={busy || !pickedUserId}
              className="font-display text-xs uppercase tracking-[0.15em] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {busy ? "Linking…" : "Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
