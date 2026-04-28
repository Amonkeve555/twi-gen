import { forwardRef, useEffect, useImperativeHandle, useState, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/sessionId";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CLAIMED_KEY = "ti4-guest-data-claimed";

export type ClaimGuestDataHandle = {
  /** Manually open the claim dialog, ignoring the once-per-device flag. */
  openManually: () => Promise<void>;
};

/** Shown once per device after sign-in, or manually via openManually(). */
const ClaimGuestDataDialog = forwardRef<ClaimGuestDataHandle>((_, ref) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [hostedCount, setHostedCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);

  const checkAndOpen = useCallback(async (isManual: boolean) => {
    if (!user) {
      if (isManual) toast.error("Sign in first to claim guest data");
      return;
    }
    const sessionId = getSessionId();
    const [{ data: hosted }, { data: joined }] = await Promise.all([
      supabase.from("lobbies").select("id").eq("host_session_id", sessionId).is("host_user_id", null),
      supabase.from("lobby_players").select("id").eq("session_id", sessionId).is("user_id", null),
    ]);
    const h = hosted?.length ?? 0;
    const p = joined?.length ?? 0;
    if (h + p > 0) {
      setHostedCount(h);
      setPlayerCount(p);
      setManual(isManual);
      setOpen(true);
    } else {
      localStorage.setItem(CLAIMED_KEY, user.id);
      if (isManual) toast.info("No guest data found on this device to claim");
    }
  }, [user]);

  useImperativeHandle(ref, () => ({
    openManually: () => checkAndOpen(true),
  }), [checkAndOpen]);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(CLAIMED_KEY) === user.id) return;
    checkAndOpen(false);
  }, [user, checkAndOpen]);

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
    if (user && !manual) localStorage.setItem(CLAIMED_KEY, user.id);
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
});

ClaimGuestDataDialog.displayName = "ClaimGuestDataDialog";

export default ClaimGuestDataDialog;
