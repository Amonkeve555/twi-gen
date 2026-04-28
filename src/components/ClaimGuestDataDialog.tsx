import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/sessionId";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CLAIMED_KEY = "ti4-guest-data-claimed";

/** Shown once per device, after sign-in, to claim legacy guest lobbies/players. */
const ClaimGuestDataDialog = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [hostedCount, setHostedCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(CLAIMED_KEY) === user.id) return;
    const sessionId = getSessionId();

    (async () => {
      const [{ data: hosted }, { data: joined }] = await Promise.all([
        supabase.from("lobbies").select("id").eq("host_session_id", sessionId).is("host_user_id", null),
        supabase.from("lobby_players").select("id").eq("session_id", sessionId).is("user_id", null),
      ]);
      const h = hosted?.length ?? 0;
      const p = joined?.length ?? 0;
      if (h + p > 0) {
        setHostedCount(h);
        setPlayerCount(p);
        setOpen(true);
      } else {
        localStorage.setItem(CLAIMED_KEY, user.id);
      }
    })();
  }, [user]);

  const claim = async () => {
    if (!user) return;
    setBusy(true);
    const sessionId = getSessionId();
    const [hostedRes, playerRes] = await Promise.all([
      supabase.from("lobbies").update({ host_user_id: user.id }).eq("host_session_id", sessionId).is("host_user_id", null),
      supabase.from("lobby_players").update({ user_id: user.id }).eq("session_id", sessionId).is("user_id", null),
    ]);
    setBusy(false);
    if (hostedRes.error || playerRes.error) {
      toast.error("Failed to claim some data");
      return;
    }
    localStorage.setItem(CLAIMED_KEY, user.id);
    toast.success("Guest data claimed");
    setOpen(false);
  };

  const dismiss = () => {
    if (user) localStorage.setItem(CLAIMED_KEY, user.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="glass imperial-border">
        <DialogHeader>
          <DialogTitle className="font-display text-lg uppercase tracking-[0.15em] text-primary">
            Claim Guest Data
          </DialogTitle>
          <DialogDescription className="font-body text-base text-muted-foreground">
            We found previous activity on this device:
            {hostedCount > 0 && <> <br />• {hostedCount} hosted {hostedCount === 1 ? "lobby" : "lobbies"}</>}
            {playerCount > 0 && <> <br />• {playerCount} player {playerCount === 1 ? "slot" : "slots"} (including past games)</>}
            <br /><br />
            Link them to your account so they appear in your lobbies, history, and stats?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={dismiss} disabled={busy} className="font-display text-xs uppercase tracking-[0.15em]">
            Skip
          </Button>
          <Button onClick={claim} disabled={busy} className="font-display text-xs uppercase tracking-[0.15em] bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Claiming..." : "Claim"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimGuestDataDialog;
