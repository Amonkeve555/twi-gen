import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Scroll, Users, Gamepad2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import tiEmblem from "@/assets/ti-emblem.png";
import { Button } from "@/components/ui/button";
import StarField from "@/components/StarField";
import PlayerSetup from "@/components/PlayerSetup";
import FactionPool from "@/components/FactionPool";
import TokenGrid from "@/components/TokenGrid";
import FactionCard from "@/components/FactionCard";
import ResultsEntry from "@/components/ResultsEntry";
import { useGameHistory } from "@/hooks/useGameHistory";
import { TI4_FACTIONS, POK_FACTIONS, type Faction } from "@/data/factions";

type Phase = "setup" | "draft" | "choose" | "reveal";

const Index = () => {
  const navigate = useNavigate();
  const { history, addGame } = useGameHistory();
  const [players, setPlayers] = useState(["Player 1", "Player 2", "Player 3"]);
  const [includePok, setIncludePok] = useState(false);
  const [excludedFactions, setExcludedFactions] = useState<Set<string>>(new Set());
  const [picksPerPlayer, setPicksPerPlayer] = useState(1);
  const [resultsSaved, setResultsSaved] = useState(false);

  const [phase, setPhase] = useState<Phase>("setup");
  const [tokenMapping, setTokenMapping] = useState<Map<number, Faction>>(new Map());
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentPickCount, setCurrentPickCount] = useState(0);
  const [playerTokens, setPlayerTokens] = useState<Map<number, number>>(new Map());
  const [choosingPlayerIndex, setChoosingPlayerIndex] = useState(0);
  const [finalAssignments, setFinalAssignments] = useState<{ player: string; faction: Faction }[]>([]);

  const availableFactions = useMemo(() => {
    return [...TI4_FACTIONS, ...(includePok ? POK_FACTIONS : [])].filter(
      (f) => !excludedFactions.has(f.name)
    );
  }, [includePok, excludedFactions]);

  const canStart = availableFactions.length >= players.length * picksPerPlayer;

  const startDraft = useCallback(() => {
    const shuffled = [...availableFactions].sort(() => Math.random() - 0.5);
    const mapping = new Map<number, Faction>();
    shuffled.forEach((f, i) => mapping.set(i + 1, f));

    setTokenMapping(mapping);
    setPlayerTokens(new Map());
    setCurrentPlayerIndex(0);
    setCurrentPickCount(0);
    setChoosingPlayerIndex(0);
    setFinalAssignments([]);
    setPhase("draft");
  }, [availableFactions]);

  const selectToken = useCallback(
    (tokenId: number) => {
      const nextTokens = new Map(playerTokens);
      nextTokens.set(tokenId, currentPlayerIndex);
      setPlayerTokens(nextTokens);

      const newPickCount = currentPickCount + 1;

      if (newPickCount >= picksPerPlayer) {
        // This player is done picking
        if (currentPlayerIndex + 1 >= players.length) {
          // All players done
          if (picksPerPlayer === 1) {
            // Skip choose phase, go straight to reveal
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
            setTimeout(() => {
              setFinalAssignments(assignments);
              setPhase("reveal");
            }, 400);
          } else {
            setTimeout(() => {
              setChoosingPlayerIndex(0);
              setPhase("choose");
            }, 400);
          }
        } else {
          setCurrentPlayerIndex((prev) => prev + 1);
          setCurrentPickCount(0);
        }
      } else {
        setCurrentPickCount(newPickCount);
      }
    },
    [currentPlayerIndex, currentPickCount, picksPerPlayer, players, playerTokens, tokenMapping]
  );

  const getPlayerFactions = useCallback(
    (playerIndex: number): { tokenId: number; faction: Faction }[] => {
      const result: { tokenId: number; faction: Faction }[] = [];
      for (const [tId, ownerIdx] of playerTokens.entries()) {
        if (ownerIdx === playerIndex) {
          const faction = tokenMapping.get(tId);
          if (faction) result.push({ tokenId: tId, faction });
        }
      }
      return result;
    },
    [playerTokens, tokenMapping]
  );

  const chooseFaction = useCallback(
    (faction: Faction) => {
      const newAssignments = [...finalAssignments, { player: players[choosingPlayerIndex], faction }];
      setFinalAssignments(newAssignments);

      if (choosingPlayerIndex + 1 >= players.length) {
        setTimeout(() => setPhase("reveal"), 400);
      } else {
        setChoosingPlayerIndex((prev) => prev + 1);
      }
    },
    [choosingPlayerIndex, players, finalAssignments]
  );

  const reset = useCallback(() => {
    setPhase("setup");
    setPlayerTokens(new Map());
    setFinalAssignments([]);
    setCurrentPlayerIndex(0);
    setCurrentPickCount(0);
    setChoosingPlayerIndex(0);
    setResultsSaved(false);
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
          <img
            src={tiEmblem}
            alt="Twilight Imperium Emblem"
            className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-4 drop-shadow-[0_0_15px_hsl(42_85%_55%/0.3)]"
          />
          <div className="imperial-divider w-48 mx-auto mb-4" />
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-[0.15em] text-primary text-glow mb-2">
            Twilight Imperium
          </h1>
          <p className="font-display text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Race Randomizer
          </p>
          <div className="imperial-divider w-48 mx-auto mt-4" />
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
                <PlayerSetup
                  players={players}
                  onPlayersChange={setPlayers}
                  picksPerPlayer={picksPerPlayer}
                  onPicksPerPlayerChange={setPicksPerPlayer}
                />
                <div className="imperial-divider" />
                <FactionPool
                  includePok={includePok}
                  onIncludePokChange={setIncludePok}
                  excludedFactions={excludedFactions}
                  onToggleFaction={toggleFaction}
                />
              </div>

              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={startDraft}
                  disabled={!canStart}
                  size="lg"
                  className="font-display text-sm uppercase tracking-[0.2em] glow-primary px-10 py-6 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Begin Local Draft
                </Button>
                {!canStart && (
                  <p className="text-destructive text-sm font-body">
                    Not enough factions ({availableFactions.length}) for {players.length} players × {picksPerPlayer} picks = {players.length * picksPerPlayer} needed
                  </p>
                )}
                <div className="imperial-divider w-32 mx-auto" />
                <Button
                  onClick={() => navigate("/create")}
                  size="lg"
                  variant="outline"
                  className="font-display text-sm uppercase tracking-[0.2em] px-10 py-6 border-border text-muted-foreground hover:text-primary hover:border-primary/40"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Create Online Lobby
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/my-lobbies")}
                    className="font-display text-xs uppercase tracking-[0.15em] border-border text-muted-foreground hover:text-primary hover:border-primary/40"
                  >
                    <Gamepad2 className="mr-2 h-3 w-3" />
                    My Lobbies
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/history")}
                    className="font-display text-xs uppercase tracking-[0.15em] border-border text-muted-foreground hover:text-primary hover:border-primary/40"
                  >
                    <Scroll className="mr-2 h-3 w-3" />
                    Game History{history.length > 0 ? ` (${history.length})` : ""}
                  </Button>
                </div>
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
                 <p className="text-muted-foreground text-base font-body uppercase tracking-[0.15em] mb-1">
                  Selecting token
                </p>
                <p className="font-display text-xl text-primary text-glow">
                  {players[currentPlayerIndex]}
                </p>
                 <p className="text-muted-foreground text-base font-body mt-1">
                  Pick {currentPickCount + 1} of {picksPerPlayer} · Player {currentPlayerIndex + 1} of {players.length}
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

          {phase === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center glass imperial-border rounded p-4">
                <p className="text-muted-foreground text-sm font-body uppercase tracking-[0.15em] mb-1">
                  Choose thy faction
                </p>
                <p className="font-display text-xl text-primary text-glow">
                  {players[choosingPlayerIndex]}
                </p>
                <p className="text-muted-foreground text-xs font-body mt-1">
                  Player {choosingPlayerIndex + 1} of {players.length}
                </p>
              </div>

              <div className="grid gap-3">
                {getPlayerFactions(choosingPlayerIndex).map(({ faction }) => (
                  <motion.button
                    key={faction.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => chooseFaction(faction)}
                    className="w-full glass imperial-border rounded p-4 text-left transition-all hover:border-primary/60 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-sm border border-border flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, hsl(${faction.color}) 0%, hsl(${faction.color} / 0.4) 100%)`,
                        }}
                      />
                      <div>
                        <p className="font-display text-sm uppercase tracking-[0.1em] text-primary">
                          {faction.name}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

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
                {finalAssignments.map((a, i) => (
                  <FactionCard
                    key={a.faction.name}
                    playerName={a.player}
                    faction={a.faction}
                    index={i}
                  />
                ))}
              </div>

              {!resultsSaved && (
                <>
                  <div className="imperial-divider w-32 mx-auto" />
                  <ResultsEntry
                    assignments={finalAssignments}
                    onSave={(game) => {
                      addGame(game);
                      setResultsSaved(true);
                    }}
                    onSkip={() => setResultsSaved(true)}
                  />
                </>
              )}

              <div className="flex justify-center gap-3 pt-4">
                <Button onClick={reset} size="lg" className="font-display text-sm uppercase tracking-[0.2em] glow-primary px-10 py-6 bg-primary text-primary-foreground hover:bg-primary/90">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  New Game
                </Button>
                {resultsSaved && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate("/history")}
                    className="font-display text-sm uppercase tracking-[0.2em] px-6 py-6 border-border text-muted-foreground hover:text-primary hover:border-primary/40"
                  >
                    <Scroll className="mr-2 h-5 w-5" />
                    History
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
