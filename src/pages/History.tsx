import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StarField from "@/components/StarField";
import { useGameHistory } from "@/hooks/useGameHistory";
import { useOnlineGameHistory } from "@/hooks/useOnlineGameHistory";
import tiEmblem from "@/assets/ti-emblem.png";

const History = () => {
  const navigate = useNavigate();
  const { history, deleteGame, clearHistory } = useGameHistory();
  const { games: onlineGames, loading: onlineLoading } = useOnlineGameHistory();

  const allGames = useMemo(() => {
    const map = new Map();
    for (const g of history) map.set(g.id, g);
    for (const g of onlineGames) map.set(g.id, g);
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [history, onlineGames]);

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
            className="w-16 h-16 mx-auto mb-3 drop-shadow-[0_0_15px_hsl(42_85%_55%/0.3)]"
          />
          <div className="imperial-divider w-48 mx-auto mb-4" />
          <h1 className="font-display text-2xl md:text-3xl font-black tracking-[0.15em] text-primary text-glow mb-2">
            Game History
          </h1>
          <div className="imperial-divider w-48 mx-auto mt-4" />
        </motion.div>

        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="font-display text-xs uppercase tracking-[0.15em] border-border text-muted-foreground hover:text-primary hover:border-primary/40"
          >
            <ArrowLeft className="mr-2 h-3 w-3" />
            Back
          </Button>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="font-display text-xs uppercase tracking-[0.15em] border-border text-destructive hover:text-destructive hover:border-destructive/40"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Clear Local
            </Button>
          )}
        </div>

        {onlineLoading && allGames.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass imperial-border rounded p-10 text-center"
          >
            <p className="font-display text-sm uppercase tracking-[0.15em] text-muted-foreground">
              Loading history…
            </p>
          </motion.div>
        ) : allGames.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass imperial-border rounded p-10 text-center"
          >
            <Trophy className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="font-display text-sm uppercase tracking-[0.15em] text-muted-foreground">
              No games recorded yet
            </p>
            <p className="font-body text-xs text-muted-foreground mt-2">
              Complete a draft and save results to see them here
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {allGames.map((game, gi) => {
              const isOnline = game.id.startsWith("online-");
              const sortedPlayers = [...game.players].sort((a, b) => a.rank - b.rank);
              const winner = sortedPlayers[0];
              const dateStr = new Date(game.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.08 }}
                  className="glass imperial-border rounded p-5 relative overflow-hidden group"
                >
                  {/* Top accent */}
                  {winner && (
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{
                        background: `linear-gradient(90deg, transparent, hsl(${winner.faction.color}), transparent)`,
                      }}
                    />
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-display text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        {dateStr}
                      </p>
                      {winner && (
                        <p className="font-display text-sm text-primary text-glow flex items-center gap-1 mt-1">
                          <Trophy className="h-3 w-3" />
                          {winner.player} — {winner.faction.shortName}
                        </p>
                      )}
                    </div>
                    {!isOnline && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGame(game.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="imperial-divider mb-3" />

                  {/* Results table */}
                  <div className="space-y-1">
                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 items-center text-[10px] font-body uppercase tracking-widest text-muted-foreground px-1">
                      <span className="w-6 text-center">#</span>
                      <span>Player / Faction</span>
                      <span className="w-10 text-center">VP</span>
                      <span className="w-6" />
                    </div>
                    {sortedPlayers.map((p) => (
                      <div
                        key={p.player + p.faction.name}
                        className={`grid grid-cols-[auto_1fr_auto] gap-2 items-center py-1 px-1 rounded ${
                          p.rank === 1 ? "bg-primary/5" : ""
                        }`}
                      >
                        <span className="w-6 text-center font-display text-xs text-muted-foreground">
                          {p.rank}
                        </span>
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: `hsl(${p.faction.color})` }}
                          />
                          <span className="font-body text-sm text-foreground truncate">
                            {p.player}
                          </span>
                          <span
                            className="font-body text-xs truncate"
                            style={{ color: `hsl(${p.faction.color} / 0.7)` }}
                          >
                            {p.faction.shortName}
                          </span>
                        </div>
                        <span className="w-10 text-center font-display text-xs text-primary">
                          {p.vp}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
