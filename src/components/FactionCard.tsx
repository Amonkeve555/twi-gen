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
      transition={{ delay: index * 0.18, duration: 0.6, type: "spring" }}
      className="glass imperial-border rounded p-5 relative overflow-hidden group"
    >
      {/* Top accent bar with faction color */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, hsl(${faction.color}), transparent)`,
        }}
      />

      {/* Corner accents */}
      <div
        className="absolute top-0 left-0 w-4 h-4 border-t border-l opacity-40"
        style={{ borderColor: `hsl(${faction.color})` }}
      />
      <div
        className="absolute top-0 right-0 w-4 h-4 border-t border-r opacity-40"
        style={{ borderColor: `hsl(${faction.color})` }}
      />

      <div className="relative z-10">
        <p className="text-muted-foreground text-base font-body uppercase tracking-[0.15em] mb-1">
          {playerName}
        </p>
        <h3
          className="font-display text-lg font-bold tracking-wide"
          style={{
            color: `hsl(${faction.color})`,
            textShadow: `0 0 12px hsl(${faction.color} / 0.4)`,
          }}
        >
          {faction.name}
        </h3>
      </div>

      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 rounded"
        style={{ backgroundColor: `hsl(${faction.color})` }}
      />
    </motion.div>
  );
};

export default FactionCard;
