import { useState } from "react";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/sessionId";
import { toast } from "sonner";

interface Player {
  id: string;
  player_name: string;
  session_id: string;
}

interface ClaimPlayerDialogProps {
  players: Player[];
  lobbyId: string;
}

const ClaimPlayerDialog = ({ players, lobbyId }: ClaimPlayerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const sessionId = getSessionId();

  const alreadyInLobby = players.some((p) => p.session_id === sessionId);
  if (alreadyInLobby) return null;

  const claimPlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Claim "${playerName}" as yourself? This will link this device to that player.`)) return;
    setClaiming(playerId);
    const { error } = await supabase
      .from("lobby_players")
      .update({ session_id: sessionId })
      .eq("id", playerId)
      .eq("lobby_id", lobbyId);
    setClaiming(null);
    if (error) {
      toast.error("Failed to claim player");
    } else {
      toast.success(`You are now playing as ${playerName}`);
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="font-display text-xs uppercase tracking-[0.15em] border-primary/40 text-primary hover:bg-primary/10"
      >
        <UserCheck className="mr-2 h-3 w-3" />
        Rejoin as Player
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass imperial-border">
          <DialogHeader>
            <DialogTitle className="font-display text-lg uppercase tracking-[0.15em] text-primary">
              Rejoin as Player
            </DialogTitle>
            <DialogDescription className="font-body text-base text-muted-foreground">
              Select your name to link this device to your player slot.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => claimPlayer(p.id, p.player_name)}
                disabled={claiming !== null}
                className="w-full flex items-center justify-between p-3 rounded bg-secondary/50 border border-border hover:border-primary/40 transition-colors disabled:opacity-50"
              >
                <span className="font-display text-base text-primary">{p.player_name}</span>
                <span className="font-body text-xs text-muted-foreground">
                  {claiming === p.id ? "Claiming..." : "This is me"}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClaimPlayerDialog;
