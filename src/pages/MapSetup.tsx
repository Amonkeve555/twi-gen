import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import StarField from "@/components/StarField";
import MapSetupHex from "@/components/MapSetupHex";
import { MAP_SETUPS } from "@/data/mapSetups";

type PlayerCount = 3 | 4 | 5 | 6 | 7 | 8;

const MapSetup = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState<PlayerCount>(6);
  const setup = MAP_SETUPS[count];

  return (
    <div className="min-h-screen relative">
      <StarField />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 font-display text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="imperial-divider w-48 mx-auto mb-4" />
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-[0.15em] text-primary text-glow mb-2">
            Map Setup
          </h1>
          <p className="font-display text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Official Galaxy Layout · Living Rules + Prophecy of Kings
          </p>
          <div className="imperial-divider w-48 mx-auto mt-4" />
        </motion.div>

        {/* Player count selector */}
        <div className="glass imperial-border rounded p-4 mb-6">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-primary text-glow text-center mb-3">
            Number of Players
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {([3, 4, 5, 6, 7, 8] as PlayerCount[]).map((n) => (
              <Button
                key={n}
                variant={count === n ? "default" : "outline"}
                size="sm"
                onClick={() => setCount(n)}
                className={`h-10 w-12 font-display text-base ${
                  count === n
                    ? "bg-primary text-primary-foreground glow-primary"
                    : "border-border text-muted-foreground hover:text-primary hover:border-primary/40"
                }`}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>

        {/* Hex map */}
        <motion.div
          key={count}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="glass imperial-border rounded p-4 mb-6"
        >
          <MapSetupHex setup={setup} />
        </motion.div>

        {/* Legend */}
        <div className="glass imperial-border rounded p-4 mb-6">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-primary text-glow mb-3">
            Legend
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-body text-sm">
            <LegendItem color="hsl(190 80% 60%)" label="Mecatol Rex (center)" />
            <LegendItem color="hsl(0 75% 60%)" label="Home Systems" filled />
            {count <= 5 && (
              <LegendItem color="hsl(135 70% 55%)" label="Potential Home (closest to your seat)" filled />
            )}
            <LegendItem color="hsl(135 55% 50%)" label="Player Slice" subtle />
            <LegendItem color="hsl(220 25% 50%)" label="Equidistant" />
            {(count === 7 || count === 8) && (
              <LegendItem color="hsl(280 65% 65%)" label="Hyperlane (fixed)" dashed />
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="glass imperial-border rounded p-4">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-primary mb-2">
            Setup Notes
          </p>
          <p className="font-body text-base text-muted-foreground">{setup.notes}</p>
          <p className="font-body text-xs text-muted-foreground/70 mt-3 italic">
            This is the official empty galaxy template. Players draft and place system tiles
            into the marked slots per the rulebook setup procedure.
          </p>
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({
  color,
  label,
  filled,
  subtle,
  dashed,
}: {
  color: string;
  label: string;
  filled?: boolean;
  subtle?: boolean;
  dashed?: boolean;
}) => (
  <div className="flex items-center gap-2">
    <span
      className="inline-block w-5 h-5 rounded-sm"
      style={{
        backgroundColor: filled
          ? color.replace(")", " / 0.45)")
          : subtle
          ? color.replace(")", " / 0.18)")
          : color.replace(")", " / 0.25)"),
        border: `${dashed ? "2px dashed" : "2px solid"} ${color}`,
      }}
    />
    <span className="text-muted-foreground">{label}</span>
  </div>
);

export default MapSetup;
