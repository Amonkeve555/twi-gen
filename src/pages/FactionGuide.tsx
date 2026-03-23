import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronUp, ArrowLeft, Swords, Shield, Cpu, Package, Lightbulb, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StarField from "@/components/StarField";
import { TI4_FACTIONS, POK_FACTIONS, type Faction } from "@/data/factions";

const FactionDetail = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="flex gap-3 items-start">
    <div className="text-primary mt-0.5 flex-shrink-0">{icon}</div>
    <div>
      <p className="font-display text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">{label}</p>
      <div className="text-base text-foreground font-body">{children}</div>
    </div>
  </div>
);

const FactionGuideCard = ({ faction }: { faction: Faction }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="glass imperial-border rounded overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-4 text-left cursor-pointer hover:bg-primary/5 transition-colors"
      >
        <div
          className="w-10 h-10 rounded-sm border border-border flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, hsl(${faction.color}) 0%, hsl(${faction.color} / 0.4) 100%)`,
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg uppercase tracking-[0.1em] text-primary truncate">
            {faction.name}
          </p>
          {faction.commodities !== undefined && (
            <p className="text-sm text-muted-foreground font-body">
              Commodities: {faction.commodities}
            </p>
          )}
        </div>
        <div className="text-muted-foreground flex-shrink-0">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
              {faction.abilities && faction.abilities.length > 0 && (
                <FactionDetail icon={<Swords className="h-4 w-4" />} label="Abilities">
                  <ul className="space-y-2">
                    {faction.abilities.map((a, i) => (
                      <li key={i} className="text-sm">{a}</li>
                    ))}
                  </ul>
                </FactionDetail>
              )}

              {faction.promissoryNote && (
                <FactionDetail icon={<FileText className="h-4 w-4" />} label="Promissory Note">
                  <p className="text-sm">{faction.promissoryNote}</p>
                </FactionDetail>
              )}

              {faction.startingUnits && (
                <FactionDetail icon={<Shield className="h-4 w-4" />} label="Starting Units">
                  <p className="text-sm">{faction.startingUnits}</p>
                </FactionDetail>
              )}

              {faction.startingTech && faction.startingTech.length > 0 && (
                <FactionDetail icon={<Cpu className="h-4 w-4" />} label="Starting Tech">
                  <div className="flex flex-wrap gap-2">
                    {faction.startingTech.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20">
                        {t}
                      </span>
                    ))}
                  </div>
                </FactionDetail>
              )}
              {faction.startingTech && faction.startingTech.length === 0 && (
                <FactionDetail icon={<Cpu className="h-4 w-4" />} label="Starting Tech">
                  <p className="text-sm text-muted-foreground italic">None</p>
                </FactionDetail>
              )}

              {faction.commodities !== undefined && (
                <FactionDetail icon={<Package className="h-4 w-4" />} label="Commodities">
                  <p className="text-sm">{faction.commodities}</p>
                </FactionDetail>
              )}

              {faction.strategyTip && (
                <FactionDetail icon={<Lightbulb className="h-4 w-4" />} label="Strategy Tip">
                  <p className="text-sm italic text-muted-foreground">{faction.strategyTip}</p>
                </FactionDetail>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FactionGuide = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showPok, setShowPok] = useState(true);

  const factions = useMemo(() => {
    const all = [...TI4_FACTIONS, ...(showPok ? POK_FACTIONS : [])];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.shortName.toLowerCase().includes(q) ||
        f.abilities?.some((a) => a.toLowerCase().includes(q)) ||
        f.strategyTip?.toLowerCase().includes(q)
    );
  }, [search, showPok]);

  return (
    <div className="min-h-screen relative">
      <StarField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-[0.15em] text-primary text-glow mb-2">
            Faction Guide
          </h1>
          <p className="font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">
            {factions.length} factions
          </p>
          <div className="imperial-divider w-48 mx-auto mt-4" />
        </motion.div>

        <div className="glass imperial-border rounded p-4 mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search factions, abilities, strategies..."
              className="pl-10 bg-background/50 border-border font-body"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPok}
                onChange={(e) => setShowPok(e.target.checked)}
                className="rounded border-border"
              />
              <span className="font-body text-sm text-muted-foreground">Include Prophecy of Kings</span>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          {factions.map((faction) => (
            <FactionGuideCard key={faction.name} faction={faction} />
          ))}
          {factions.length === 0 && (
            <p className="text-center text-muted-foreground font-body text-base py-8">No factions match your search.</p>
          )}
        </div>

        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="font-display text-sm uppercase tracking-[0.15em] border-border text-muted-foreground hover:text-primary hover:border-primary/40"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FactionGuide;
