import { motion } from "framer-motion";

interface TokenGridProps {
  totalTokens: number;
  takenTokens: Map<number, number>; // tokenId -> playerIndex
  players: string[];
  onSelectToken: (tokenId: number) => void;
}

const TokenGrid = ({ totalTokens, takenTokens, players, onSelectToken }: TokenGridProps) => {
  const tokens = Array.from({ length: totalTokens }, (_, i) => i + 1);

  return (
    <div className="glass rounded-xl p-6">
      <p className="font-display text-xs uppercase tracking-widest text-muted-foreground mb-4 text-center">
        Pick a token — each hides a random faction
      </p>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
        {tokens.map((id) => {
          const ownerIndex = takenTokens.get(id);
          const isTaken = ownerIndex !== undefined;

          return (
            <motion.button
              key={id}
              whileHover={!isTaken ? { scale: 1.1 } : undefined}
              whileTap={!isTaken ? { scale: 0.95 } : undefined}
              onClick={() => !isTaken && onSelectToken(id)}
              disabled={isTaken}
              className={`aspect-square rounded-lg font-display text-sm font-bold flex items-center justify-center transition-all duration-200 border ${
                isTaken
                  ? "bg-muted border-border opacity-40 cursor-not-allowed"
                  : "bg-secondary border-primary/30 hover:border-primary hover:glow-primary cursor-pointer text-foreground"
              }`}
            >
              {isTaken ? (
                <span className="text-[10px] text-muted-foreground font-body truncate px-1">
                  {players[ownerIndex]?.split(" ")[0]?.slice(0, 4)}
                </span>
              ) : (
                <span className="text-primary">{id}</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default TokenGrid;
