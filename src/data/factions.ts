export interface Faction {
  name: string;
  shortName: string;
  color: string; // tailwind-compatible hsl
}

export const TI4_FACTIONS: Faction[] = [
  { name: "The Arborec", shortName: "Arborec", color: "120 50% 35%" },
  { name: "The Barony of Letnev", shortName: "Letnev", color: "0 0% 25%" },
  { name: "The Clan of Saar", shortName: "Saar", color: "35 70% 45%" },
  { name: "The Embers of Muaat", shortName: "Muaat", color: "15 80% 50%" },
  { name: "The Emirates of Hacan", shortName: "Hacan", color: "45 80% 50%" },
  { name: "The Federation of Sol", shortName: "Sol", color: "210 60% 50%" },
  { name: "The Ghosts of Creuss", shortName: "Creuss", color: "220 70% 60%" },
  { name: "The L1Z1X Mindnet", shortName: "L1Z1X", color: "200 30% 35%" },
  { name: "The Mentak Coalition", shortName: "Mentak", color: "40 60% 45%" },
  { name: "The Naalu Collective", shortName: "Naalu", color: "50 70% 50%" },
  { name: "The Nekro Virus", shortName: "Nekro", color: "0 70% 40%" },
  { name: "Sardakk N'orr", shortName: "Sardakk", color: "0 60% 30%" },
  { name: "The Universities of Jol-Nar", shortName: "Jol-Nar", color: "260 50% 55%" },
  { name: "The Winnu", shortName: "Winnu", color: "270 40% 45%" },
  { name: "The Xxcha Kingdom", shortName: "Xxcha", color: "140 40% 40%" },
  { name: "The Yin Brotherhood", shortName: "Yin", color: "0 0% 80%" },
  { name: "The Yssaril Tribes", shortName: "Yssaril", color: "130 60% 30%" },
];

export const POK_FACTIONS: Faction[] = [
  { name: "The Argent Flight", shortName: "Argent", color: "0 0% 70%" },
  { name: "The Empyrean", shortName: "Empyrean", color: "280 50% 50%" },
  { name: "The Mahact Gene-Sorcerers", shortName: "Mahact", color: "50 50% 40%" },
  { name: "The Naaz-Rokha Alliance", shortName: "Naaz-Rokha", color: "90 40% 40%" },
  { name: "The Nomad", shortName: "Nomad", color: "30 50% 45%" },
  { name: "The Titans of Ul", shortName: "Ul", color: "20 60% 40%" },
  { name: "The Vuil'Raith Cabal", shortName: "Vuil'Raith", color: "340 70% 35%" },
];
