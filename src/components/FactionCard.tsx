import { motion } from "framer-motion";
import type { Faction } from "@/data/factions";

interface FactionCardProps {
  playerName: string;
  faction: Faction;
  index: number;
}

const FactionCard = ({ playerName, faction, index }: FactionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.15, duration: 0.5, type: "spring" }}
      className="glass rounded-lg p-5 relative overflow-hidden group"
    >
      {/* Faction color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: `hsl(${faction.color})` }}
      />
      
      <div className="relative z-10">
        <p className="text-muted-foreground text-sm font-body uppercase tracking-wider mb-1">
          {playerName}
        </p>
        <h3
          className="font-display text-lg font-bold tracking-wide"
          style={{ color: `hsl(${faction.color})` }}
        >
          {faction.name}
        </h3>
      </div>

      {/* Subtle glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg"
        style={{ backgroundColor: `hsl(${faction.color})` }}
      />
    </motion.div>
  );
};

export default FactionCard;
