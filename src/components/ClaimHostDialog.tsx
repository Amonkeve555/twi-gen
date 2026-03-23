import { useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/sessionId";
import { toast } from "@/hooks/use-toast";

interface ClaimHostDialogProps {
  lobbyId: string;
  lobbyHostPassword: string;
}

const ClaimHostDialog = ({ lobbyId, lobbyHostPassword }: ClaimHostDialogProps) => {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);

  const handleClaim = async () => {
    if (!password.trim()) return;
    setChecking(true);

    if (password !== lobbyHostPassword) {
      toast({ title: "Wrong password", description: "That password doesn't match.", variant: "destructive" });
      setChecking(false);
      return;
    }

    const sessionId = getSessionId();
    await supabase.from("lobbies").update({ host_session_id: sessionId }).eq("id", lobbyId);
    toast({ title: "Host claimed!", description: "You now have host privileges on this device." });
    setOpen(false);
    setPassword("");
    setChecking(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="font-display text-xs uppercase tracking-[0.15em] border-primary/40 text-primary hover:bg-primary/10"
      >
        <Shield className="mr-2 h-3 w-3" />
        Claim Host
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass imperial-border">
          <DialogHeader>
            <DialogTitle className="font-display text-lg uppercase tracking-[0.15em] text-primary">
              Claim Host Access
            </DialogTitle>
            <DialogDescription className="font-body text-base text-muted-foreground">
              Enter the host password you set when creating this lobby.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Host password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleClaim()}
              className="bg-input border-border font-body text-foreground focus:border-primary/40 rounded"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="font-display text-xs uppercase tracking-[0.15em]">
                Cancel
              </Button>
              <Button onClick={handleClaim} disabled={checking || !password.trim()} className="font-display text-xs uppercase tracking-[0.15em] bg-primary text-primary-foreground hover:bg-primary/90">
                {checking ? "Checking..." : "Claim"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClaimHostDialog;
