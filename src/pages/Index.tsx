import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import StarField from "@/components/StarField";
import PlayerSetup from "@/components/PlayerSetup";
import FactionPool from "@/components/FactionPool";
import FactionCard from "@/components/FactionCard";
import { TI4_FACTIONS, POK_FACTIONS, type Faction } from "@/data/factions";

const Index = () => {
  const [players, setPlayers] = useState(["Player 1", "Player 2", "Player 3"]);
  const [includePok, setIncludePok] = useState(false);
  const [excludedFactions, setExcludedFactions] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState<{ player: string; faction: Faction }[]>([]);
  const [isRandomizing, setIsRandomizing] = useState(false);

  const toggleFaction = useCallback((name: string) => {
    setExcludedFactions((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const randomize = useCallback(() => {
    const pool = [...TI4_FACTIONS, ...(includePok ? POK_FACTIONS : [])].filter(
      (f) => !excludedFactions.has(f.name)
    );

    if (pool.length < players.length) return;

    setIsRandomizing(true);
    setAssignments([]);

    setTimeout(() => {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const result = players.map((p, i) => ({ player: p, faction: shuffled[i] }));
      setAssignments(result);
      setIsRandomizing(false);
    }, 600);
  }, [players, includePok, excludedFactions]);

  const availableCount =
    [...TI4_FACTIONS, ...(includePok ? POK_FACTIONS : [])].filter(
      (f) => !excludedFactions.has(f.name)
    ).length;

  const canRandomize = availableCount >= players.length;

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
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-wider text-primary text-glow mb-2">
            Twilight Imperium
          </h1>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Race Randomizer
          </p>
        </motion.div>

        {/* Setup */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6 space-y-6 mb-6"
        >
          <PlayerSetup players={players} onPlayersChange={setPlayers} />
          <div className="border-t border-border" />
          <FactionPool
            includePok={includePok}
            onIncludePokChange={setIncludePok}
            excludedFactions={excludedFactions}
            onToggleFaction={toggleFaction}
          />
        </motion.div>

        {/* Randomize Button */}
        <div className="text-center mb-8">
          <Button
            onClick={randomize}
            disabled={!canRandomize || isRandomizing}
            size="lg"
            className="font-display text-sm uppercase tracking-widest glow-primary px-10 py-6"
          >
            <Shuffle className="mr-2 h-5 w-5" />
            {isRandomizing ? "Randomizing..." : "Randomize"}
          </Button>
          {!canRandomize && (
            <p className="text-destructive text-sm mt-2 font-body">
              Not enough factions ({availableCount}) for {players.length} players
            </p>
          )}
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {assignments.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <h2 className="font-display text-sm uppercase tracking-widest text-primary text-glow text-center mb-4">
                Assignments
              </h2>
              <div className="grid gap-3">
                {assignments.map((a, i) => (
                  <FactionCard
                    key={a.faction.name}
                    playerName={a.player}
                    faction={a.faction}
                    index={i}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
