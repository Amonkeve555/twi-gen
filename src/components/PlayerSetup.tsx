import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";

interface PlayerSetupProps {
  players: string[];
  onPlayersChange: (players: string[]) => void;
}

const PlayerSetup = ({ players, onPlayersChange }: PlayerSetupProps) => {
  const addPlayer = () => {
    if (players.length < 8) {
      onPlayersChange([...players, `Player ${players.length + 1}`]);
    }
  };

  const removePlayer = () => {
    if (players.length > 2) {
      onPlayersChange(players.slice(0, -1));
    }
  };

  const updatePlayer = (index: number, name: string) => {
    const updated = [...players];
    updated[index] = name;
    onPlayersChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm uppercase tracking-widest text-primary text-glow">
          Players
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={removePlayer}
            disabled={players.length <= 2}
            className="h-8 w-8"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="font-display text-sm w-6 text-center text-foreground">
            {players.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={addPlayer}
            disabled={players.length >= 8}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {players.map((name, i) => (
          <Input
            key={i}
            value={name}
            onChange={(e) => updatePlayer(i, e.target.value)}
            className="bg-muted border-border font-body text-foreground"
            placeholder={`Player ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerSetup;
