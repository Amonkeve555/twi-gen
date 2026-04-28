import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { Faction } from "@/data/factions";
import { cn } from "@/lib/utils";

interface FactionPickerProps {
  factions: Faction[];
  takenFactions: Map<string, string>; // faction name -> player name
  forbiddenFaction?: string | null; // user's last played faction (if no-repeat)
  forbiddenRelaxed?: boolean; // if true, forbidden is shown but still clickable
  onSelect: (faction: Faction) => void;
  disabled?: boolean;
  pendingFaction?: string | null; // name of faction currently being claimed
}

const FactionPicker = ({
  factions,
  takenFactions,
  forbiddenFaction,
  forbiddenRelaxed,
  onSelect,
  disabled,
  pendingFaction,
}: FactionPickerProps) => {
  const isClaiming = !!pendingFaction;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {factions.map((f) => {
        const takenBy = takenFactions.get(f.name);
        const isTaken = !!takenBy;
        const isForbidden = forbiddenFaction === f.name && !forbiddenRelaxed;
        const isPending = pendingFaction === f.name;
        const isDisabled = disabled || isClaiming || isTaken || isForbidden;

        return (
          <motion.button
            key={f.name}
            whileHover={!isDisabled ? { scale: 1.02 } : undefined}
            whileTap={!isDisabled ? { scale: 0.98 } : undefined}
            onClick={() => !isDisabled && onSelect(f)}
            disabled={isDisabled}
            aria-busy={isPending}
            className={cn(
              "relative glass imperial-border rounded p-4 text-left transition-all",
              isPending
                ? "border-primary/80 ring-2 ring-primary/40 cursor-wait"
                : isDisabled
                ? "opacity-40 cursor-not-allowed"
                : "hover:border-primary/60 cursor-pointer"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-sm border border-border flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, hsl(${f.color}) 0%, hsl(${f.color} / 0.4) 100%)`,
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-display text-base uppercase tracking-[0.1em] text-primary truncate">
                  {f.name}
                </p>
                {isPending && (
                  <p className="font-body text-xs text-primary">Claiming...</p>
                )}
                {!isPending && isTaken && (
                  <p className="font-body text-xs text-muted-foreground truncate">
                    Taken by {takenBy}
                  </p>
                )}
                {!isPending && isForbidden && !isTaken && (
                  <p className="font-body text-xs text-destructive">
                    Played last game
                  </p>
                )}
                {!isPending && forbiddenFaction === f.name && forbiddenRelaxed && !isTaken && (
                  <p className="font-body text-xs text-amber-400">
                    Repeat allowed
                  </p>
                )}
              </div>
              {isPending && (
                <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default FactionPicker;
