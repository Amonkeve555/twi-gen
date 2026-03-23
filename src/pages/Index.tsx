import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import StarField from "@/components/StarField";
import PlayerSetup from "@/components/PlayerSetup";
import FactionPool from "@/components/FactionPool";
import TokenGrid from "@/components/TokenGrid";
import FactionCard from "@/components/FactionCard";
import { TI4_FACTIONS, POK_FACTIONS, type Faction } from "@/data/factions";

type Phase = "setup" | "draft" | "reveal";

const Index = () => {
  const [players, setPlayers] = useState(["Player 1", "Player 2", "Player 3"]);
  const [includePok, setIncludePok] = useState(false);
  const [excludedFactions, setExcludedFactions] = useState<Set<string>>(new Set());

  const [phase, setPhase] = useState<Phase>("setup");
  const [tokenMapping, setTokenMapping] = useState<Map<number, Faction>>(new Map());
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playerTokens, setPlayerTokens] = useState<Map<number, number>>(new Map());
  const [revealedAssignments, setRevealedAssignments] = useState<{ player: string; faction: Faction }[]>([]);

  const availableFactions = useMemo(() => {
    return [...TI4_FACTIONS, ...(includePok ? POK_FACTIONS : [])].filter(
      (f) => !excludedFactions.has(f.name)
    );
  }, [includePok, excludedFactions]);

  const canStart = availableFactions.length >= players.length;

  const startDraft = useCallback(() => {
    const shuffled = [...availableFactions].sort(() => Math.random() - 0.5);
    const mapping = new Map<number, Faction>();
    shuffled.forEach((f, i) => mapping.set(i + 1, f));

    setTokenMapping(mapping);
    setPlayerTokens(new Map());
    setCurrentPlayerIndex(0);
    setRevealedAssignments([]);
    setPhase("draft");
  }, [availableFactions]);

  const selectToken = useCallback(
    (tokenId: number) => {
      setPlayerTokens((prev) => {
        const next = new Map(prev);
        next.set(tokenId, currentPlayerIndex);
        return next;
      });

      if (currentPlayerIndex + 1 >= players.length) {
        setTimeout(() => setPhase("reveal"), 400);

        const nextTokens = new Map(playerTokens);
        nextTokens.set(tokenId, currentPlayerIndex);

        const assignments: { player: string; faction: Faction }[] = [];
        players.forEach((name, pIdx) => {
          for (const [tId, ownerIdx] of nextTokens.entries()) {
            if (ownerIdx === pIdx) {
              const faction = tokenMapping.get(tId);
              if (faction) assignments.push({ player: name, faction });
              break;
            }
          }
        });

        setTimeout(() => setRevealedAssignments(assignments), 400);
      } else {
        setCurrentPlayerIndex((prev) => prev + 1);
      }
    },
    [currentPlayerIndex, players, playerTokens, tokenMapping]
  );

  const reset = useCallback(() => {
    setPhase("setup");
    setPlayerTokens(new Map());
    setRevealedAssignments([]);
    setCurrentPlayerIndex(0);
  }, []);

  const toggleFaction = useCallback((name: string) => {
    setExcludedFactions((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen relative">
      <StarField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          {/* Decorative top line */}
          <div className="imperial-divider w-48 mx-auto mb-6" />
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-[0.15em] text-primary text-glow mb-2">
            Twilight Imperium
          </h1>
          <p className="font-display text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Race Randomizer
          </p>
          <div className="imperial-divider w-48 mx-auto mt-6" />
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="glass imperial-border rounded p-6 space-y-6 mb-6">
                <PlayerSetup players={players} onPlayersChange={setPlayers} />
                <div className="imperial-divider" />
                <FactionPool
                  includePok={includePok}
                  onIncludePokChange={setIncludePok}
                  excludedFactions={excludedFactions}
                  onToggleFaction={toggleFaction}
                />
              </div>

              <div className="text-center">
                <Button
                  onClick={startDraft}
                  disabled={!canStart}
                  size="lg"
                  className="font-display text-sm uppercase tracking-[0.2em] glow-primary px-10 py-6 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Begin the Draft
                </Button>
                {!canStart && (
                  <p className="text-destructive text-sm mt-2 font-body">
                    Not enough factions ({availableFactions.length}) for {players.length} players
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {phase === "draft" && (
            <motion.div
              key="draft"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center glass imperial-border rounded p-4">
                <p className="text-muted-foreground text-sm font-body uppercase tracking-[0.15em] mb-1">
                  Selecting token
                </p>
                <p className="font-display text-xl text-primary text-glow">
                  {players[currentPlayerIndex]}
                </p>
                <p className="text-muted-foreground text-xs font-body mt-1">
                  Player {currentPlayerIndex + 1} of {players.length}
                </p>
              </div>

              <TokenGrid
                totalTokens={availableFactions.length}
                takenTokens={playerTokens}
                players={players}
                onSelectToken={selectToken}
              />

              <div className="text-center">
                <Button variant="outline" size="sm" onClick={reset} className="font-display text-xs uppercase tracking-[0.15em] border-border text-muted-foreground hover:text-primary hover:border-primary/40">
                  <RotateCcw className="mr-2 h-3 w-3" />
                  Restart
                </Button>
              </div>
            </motion.div>
          )}

          {phase === "reveal" && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="font-display text-sm uppercase tracking-[0.3em] text-primary text-glow text-center">
                Assignments Revealed
              </h2>
              <div className="imperial-divider w-32 mx-auto" />
              <div className="grid gap-3">
                {revealedAssignments.map((a, i) => (
                  <FactionCard
                    key={a.faction.name}
                    playerName={a.player}
                    faction={a.faction}
                    index={i}
                  />
                ))}
              </div>

              <div className="text-center pt-4">
                <Button onClick={reset} size="lg" className="font-display text-sm uppercase tracking-[0.2em] glow-primary px-10 py-6 bg-primary text-primary-foreground hover:bg-primary/90">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  New Game
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
